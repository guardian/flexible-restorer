## Migration plan

### Phase 0 — Prerequisites
1. Identify the AWS account/profile and confirm you can deploy to CODE and PROD (the account is reached via the `composer` profile).
2. Note the fixed identifiers to reuse: app `restorer2`, stack `flexible`, stages `CODE`/`PROD`, **CFN stack names `Flexible-Restorer-CODE` and `Flexible-Restorer-PROD`** (per-stage), domains `restorer.code.dev-gutools.co.uk` / `restorer.gutools.co.uk`.
3. Confirm whether the DNS records for those domains are managed via NS1 (`dig +nssearch +noall +answer gutools.co.uk`) so DNS can later move to a `GuCname`.
4. **Cross-repo ownership**: this stack was previously built/deployed from `editorial-tools-platform` (`cloudformation/composer-account/flexible-content/restorer.yaml`, Riff-Raff project `editorial-tools:flexible:restorer2::cloudformation`). CI/CD there must be removed before/alongside the Phase 1 merge so two repos don't deploy the same stack. Done in the `flexible-restorer-move-cicd` branch of `editorial-tools-platform` (removes the Riff-Raff step and the orphaned template).

### Phase 1 — Add GuCDK wrapping the existing template
Goal: `CDK(cfn.yaml) -> cfn.json` with zero resource changes (tags only).

1. Rename the current template to the expected convention, e.g. `cloudformation/restorer.cfn.yaml`.
2. Scaffold the CDK project pointing at that template:
   ```shell
   npx @guardian/cdk@latest new --app restorer2 --stack flexible --stage PROD \
     --package-manager npm --yaml-template-location cloudformation/restorer.cfn.yaml
   ```
   This generates a `cdk/` directory with `bin/cdk.ts`, a stack class using `CfnInclude`, package.json, tests, and snapshot tests.
3. Define both stages in `bin/cdk.ts` (`Restorer2-euwest-1-CODE` and `Restorer2-euwest-1-PROD`). **Set a per-stage `cloudFormationStackName` (`Flexible-Restorer-CODE` / `Flexible-Restorer-PROD`)** so CDK adopts the existing stacks; without it, `cdk diff` compares against the CDK stack id, finds no stack, and reports every resource as new (risking a duplicate parallel stack).
4. Run the diff against the live stack and confirm it only shows **tag additions**:
   ```shell
   npm run diff -- --profile composer Restorer2-euwest-1-CODE
   ```
   ✅ Verified against CODE: diff is tags-only (`gu:cdk:version`, `gu:repo`, `Stack`, `Stage` tags + `gu:cdk:*` metadata; `Stage` resolves from `{"Ref":"Stage"}` to the literal, and ASG `PropagateAtLaunch` changes from string `"true"` to boolean `true`). No resources added/removed/replaced. Note: the `composer` profile lacks `cloudformation:CreateChangeSet`, so CDK falls back to a template-only diff — review the change set in the console at deploy time.
5. Wire up CI (build + synth + snapshot tests) and CD (Riff-Raff `cloud-formation` deployment of the synthesized templates). Update riff-raff.yaml to deploy the CDK-generated templates (Riff-Raff appends the stage to `cloudFormationStackName: Flexible-Restorer`).
6. Raise PR (depends on the editorial-tools-platform CI/CD removal), merge, deploy CODE then PROD, and confirm a normal deploy still works. At this point CDK merely wraps the legacy template.

### Phase 2 — Stage 1: introduce `GuEc2App` (dual-stack)
Goal: new ALB-based infrastructure running alongside the legacy ELB stack.

✅ **Implemented** on branch `migrate/gucdk-phase-2-ec2-app` (based on the Phase 1 branch). Lint, tests (CODE + PROD snapshots) and synth are green; the CODE `cdk diff` is purely additive (see below). Not yet deployed.

1. Instantiate a `GuEc2App` in the CDK stack. As built:
   - `applicationPort: 9000`, health check path `/management/healthcheck`.
   - Instance type `t4g.micro` (arm64, `BURSTABLE4_GRAVITON`/`MICRO`); IMDSv2 is the GuCDK default.
   - `userData` replicating the `.deb` download/install from `composer-dist` (`s3://composer-dist/flexible/${Stage}/restorer2/restorer2.deb`).
   - `scaling` = min 2 / max 4 (both stages).
   - `additionalPolicies`: ported the app-specific inline policies as `GuAllowPolicy` (SSM app params, composer-dist, pan-domain, permissions-cache, snapshotter buckets list/get, KMS decrypt, CloudWatch). **`GuInstanceRole` already grants ec2/autoscaling `Describe*` (via `GuDescribeEC2Policy`), SSM SSH, parameter-store reads and Kinesis log shipping**, so those were *not* duplicated — the redundant `autoscaling:Describe*` policy from an earlier draft was removed. The app itself only calls S3; the config/identity library needs `ec2:DescribeTags`, which `GuInstanceRole` covers.
   - `access: { scope: AccessScope.PUBLIC }` — matches the legacy LB (443 from `0.0.0.0/0`); the app is protected by pan-domain auth.
   - `applicationLogging: { enabled: true }` with `imageRecipe: editorial-tools-jammy-java11-ARM-WITH-cdk-base` (cdk-base role → automatic log shipping to ELK).
   - `monitoringConfiguration: { noMonitoring: true }` — matches legacy (no CFN alarms); add alarms later.
   - Extra security groups: the flexible-content API + secondary-API SGs are attached to the instances so they can reach those ELBs; **PROD additionally attaches the CODE API SGs** (PROD→CODE restore). This lands at exactly **5 instance SGs** (1 HTTPS-egress + 4 API) — the private-subnet limit.
   - `certificateProps: { domainName }` per stage → GuCDK creates a `GuCertificate` on the real per-stage domain (`restorer.code.dev-gutools.co.uk` / `restorer.gutools.co.uk`). DNS still points at the legacy ELB until Phase 3.
   - Reuses the included template's `VpcId`/`PrivateVpcSubnets`/`PublicVpcSubnets`/`KmsKeyARN` parameters (via `cfnInclude.getParameter(...)`) so both stacks share the same network and key, and to avoid GuCDK's default `VpcId` parameter clashing with the template's.
2. Tag the **new** ASG `gu:riffraff:new-asg = true` — done via `Tags.of(ec2App.autoScalingGroup)`.
3. Add `asgMigrationInProgress: true` to the `restorer2` autoscaling deployment in riff-raff.yaml — done. Also switched `cfn-restorer2` to `amiParametersToTags` with two AMIs: legacy `AMI` (`editorial-tools-jammy-java11`) and new `AMIRestorer2` (`editorial-tools-jammy-java11-ARM-WITH-cdk-base`).
   - Also renamed the legacy template's `LoggingStreamName` parameter to `LegacyLoggingStreamName` to avoid a logical-ID clash with GuCDK's own `LoggingStreamName` parameter (same SSM default; only affects the legacy ASG's `LogKinesisStreamName` tag ref).
4. Manually apply the CFN change set via the console after main is deployed:
   - Populate the `AMIRestorer2` parameter with the AMI currently in use.
   - Verify the change set contains only **Add** operations (the CODE `cdk diff` confirmed this: the only change to an existing resource is the cosmetic `LoggingStreamName` → `LegacyLoggingStreamName` tag ref on the legacy ASG — no replacement).
5. Deploy via Riff-Raff; confirm both ASGs update.
6. Test the app via the **new ALB's DNS name** (CFN output `LoadBalancerRestorer2DnsName`) with the app's `Host` header.

Known benign diff artefacts (no action): (a) CDK grants the LB egress to the API SGs on 9000 (connections-model side effect; the LB never uses it), and (b) the legacy ICMP-from-office ingress was dropped (SSM Session Manager covers instance access).


### Phase 3 — Stage 2: switch DNS
1. Start managing the DNS records via a `GuCname` construct, matching current NS1 properties, still pointing at the **old ELB**.
2. Lower the TTL to a few minutes; wait for it to expire.
3. Update the CNAME to point at the **new ALB**.
4. Test functionality (auth via pan-domain, snapshot listing/restore, exports).
5. Soak for a while (fast rollback = revert the DNS change). Once confident, raise the TTL again.

### Phase 4 — Stage 3: cleanup
1. In CloudWatch, confirm the **old ELB receives 0 requests**.
2. Remove redundant legacy resources from `restorer.cfn.yaml`: the ELB, ASG, LaunchConfiguration, old security groups, old IAM role/policies, and old certificate. If the file becomes empty, remove it and the `CfnInclude` block.
3. Remove the `gu:riffraff:new-asg` tag from the new ASG.
4. Remove `asgMigrationInProgress` from riff-raff.yaml and set `amiParameter` to `AMIRestorer2`.
5. Preview the change set (mostly removals + ASG tag change), apply manually, then deploy via Riff-Raff.
6. Confirm the app still works end-to-end.

### Phase 5 — Follow-ups
- Migrate any remaining stateful/shared resources per the stateful-resources guide (none in this stack — the S3 buckets and KMS key are owned elsewhere, so nothing to move here).
- Delete the cloudformation template entirely once fully on `GuEc2App`, reaching the target `CDK -> cfn.json`.

---

Key risks to watch: the **five-security-group limit** on private-VPC instances (Phase 2 lands exactly at 5 on PROD — verified in the synthesized template; do not add further instance SGs), preserving the **`restorer2` app tag** (Riff-Raff `autoscaling` deployment keys off it), and ensuring the ALB certificate covers the exact stage domain (done via per-stage `certificateProps`).
