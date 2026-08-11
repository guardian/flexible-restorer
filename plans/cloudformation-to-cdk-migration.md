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

1. Instantiate a `GuEc2App` in the CDK stack. Map the existing config:
   - `applicationPort: 9000`, health check path `/management/healthcheck`.
   - `instanceMetadata: { httpTokens: 'required' }`, instance type `t4g.micro` (arm64).
   - `userData` replicating the `.deb` download/install from `composer-dist`.
   - `scaling` = min 2 / max 4 per stage.
   - `roleConfiguration` / `iamPolicies`: port each inline policy (SSM, S3 buckets, KMS, Kinesis logging, CloudWatch, EC2 describe) as `GuAllowPolicy` constructs; the SSM managed policy is added by GuCDK automatically.
   - `access`: restrict the ALB appropriately (the legacy LB allows 443 from `0.0.0.0/0`).
   - Add the extra security groups so the instances can still reach the flexible-content API ELBs (and PROD→CODE access).
   - `certificateProps` / ACM: reference the existing certificate or let the pattern manage one.
2. Add the tag `gu:riffraff:new-asg = true` to the **new** ASG.
3. Add the `asgMigrationInProgress` parameter to riff-raff.yaml so Riff-Raff deploys to both ASGs.
4. Manually apply the CFN change set via the console after main is deployed:
   - Populate the `AMIRestorer2` parameter with the AMI currently in use.
   - Verify the change set contains only **Add** operations.
5. Deploy via Riff-Raff; confirm both ASGs update.
6. Test the app via the **new ALB's DNS name** (from the CFN outputs).

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

Key risks to watch: the **five-security-group limit** on private-VPC instances (the current template deliberately merges rules — replicate that in the CDK `access`/SG config), preserving the **`restorer2` app tag** (Riff-Raff `autoscaling` deployment keys off it), and ensuring the ALB certificate covers the exact stage domain.
