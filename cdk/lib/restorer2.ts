import { AccessScope } from "@guardian/cdk/lib/constants";
import type { GuStackProps} from "@guardian/cdk/lib/constructs/core";
import {GuStack} from "@guardian/cdk/lib/constructs/core";
import { GuCname } from "@guardian/cdk/lib/constructs/dns";
import { GuAllowPolicy, GuDeveloperPolicy, GuGetS3ObjectsPolicy } from "@guardian/cdk/lib/constructs/iam";
import {GuLoadBalancedAppExperimental} from "@guardian/cdk/lib/experimental/patterns/gu-load-balanced-app";
import type {App} from "aws-cdk-lib";
import { Size} from "aws-cdk-lib";
import { CfnParameter, Duration } from "aws-cdk-lib";
import {BurstablePerformance} from "aws-cdk-lib/aws-ec2";
import { CfnService } from "aws-cdk-lib/aws-ecs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

const app = "restorer2";

interface StageConfig {
  domainName: string;
  /** Pan-domain auth domain, matching `AppConfig.domainFromStage`. */
  panDomain: string;
  snapshotBucketSuffix: string;
  /**
   * Security groups of the flexible-content API (and secondary API) ELBs, to
   * allow the restorer instances to reach the API.
   */
  accessToApiSecurityGroupIds: string[];
}

const stageConfigs: Record<"CODE" | "PROD", StageConfig> = {
  CODE: {
    domainName: "restorer.code.dev-gutools.co.uk",
    panDomain: "code.dev-gutools.co.uk",
    snapshotBucketSuffix: "code",
    accessToApiSecurityGroupIds: ["sg-4d028336", "sg-3137fa4b"],
  },
  PROD: {
    domainName: "restorer.gutools.co.uk",
    panDomain: "gutools.co.uk",
    snapshotBucketSuffix: "prod",
    accessToApiSecurityGroupIds: ["sg-4744c43c", "sg-baae78c0"],
  },
};

export class Restorer2 extends GuStack {
  constructor(scope: App, id: string, props: GuStackProps) {
    super(scope, id, props);

    const kmsKeyArnParameter = new CfnParameter(this, "KmsKeyARN", {
      type: "String",
      description: "ARN of KMS key that was used to encrypt the backups",
    });

    const stageConfig = stageConfigs[this.stage as "CODE" | "PROD"];

    const kmsKeyArn = kmsKeyArnParameter.valueAsString;

    const snapshotBuckets = [
      `flexible-snapshotter-${stageConfig.snapshotBucketSuffix}`,
      `flexible-secondary-snapshotter-${stageConfig.snapshotBucketSuffix}`,
    ];

    const panDomainSettingsPaths = (panDomain: string) => ([
      `${panDomain}.settings`,
      `${panDomain}.settings.public`,
    ]);

    const panDomainKeysPath = "*.p12";

    const permissionsCachePath = (stage: string) => `${stage}/permissions.json`;

    const additionalPolicies = [
      new GuAllowPolicy(this, "RestorerSSMPolicy", {
        actions: ["ssm:GetParameters", "ssm:GetParametersByPath"],
        resources: [`arn:aws:ssm:*:*:parameter/flexible/restorer/${this.stage}*`],
      }),
      new GuGetS3ObjectsPolicy(this, "RestorerGetDistributablesPolicy", {
        bucketName: "composer-dist",
        paths: [`flexible/${this.stage}/${app}/*`],
      }),
      new GuGetS3ObjectsPolicy(this, "PanDomainPolicy", {
        bucketName: "pan-domain-auth-settings",
        paths: panDomainSettingsPaths(stageConfig.panDomain).concat([panDomainKeysPath]),
      }),
      new GuGetS3ObjectsPolicy(this, "PermissionsPolicy", {
        bucketName: "permissions-cache",
        paths: [permissionsCachePath(this.stage)],
      }),
      new GuAllowPolicy(this, "RestorerSnapshotBucketListPolicy", {
        actions: ["s3:ListBucket"],
        resources: snapshotBuckets.map((bucket) => `arn:aws:s3:::${bucket}`),
      }),
      new GuAllowPolicy(this, "RestorerSnapshotBucketGetPolicy", {
        actions: ["s3:GetObject"],
        resources: snapshotBuckets.map((bucket) => `arn:aws:s3:::${bucket}/*`),
      }),
      new GuAllowPolicy(this, "KMSKeyPolicy", {
        actions: ["kms:Decrypt", "kms:DescribeKey"],
        resources: [kmsKeyArn],
      }),
    ];

      const loadBalancedApp = new GuLoadBalancedAppExperimental(this, {
         app,
         access: { scope: AccessScope.PUBLIC },
         applicationPort: 9000,
         monitoringConfiguration: { noMonitoring: true },
         certificateProps: { domainName: stageConfig.domainName },
         healthcheck: { path: "/management/healthcheck" },
         additionalPolicies,
         ecsProps: {
             imageIdentifier: process.env.IMAGE_DIGEST ?? "DEV",
             cpu: 2048,
             memoryLimitMiB: 1024,
             scaling: {
                 minimumTasks: 2,
                 maximumTasks: 4,
             },
             managedInstancesProps: {
                 instancesRequirements: {
                     vCpuCountMin: 2,
                     burstablePerformance: BurstablePerformance.REQUIRED,
                     memoryMin: Size.mebibytes(1024),
                     allowedInstanceTypes: ['t4g.*'],
                 }
             },
             provisionManagedSecurityRole: true,
         }
     });

    // Allow the restorer instances to reach the flexible-content API ELBs.
    // PROD additionally needs access to the CODE API (to restore content into
    // CODE). Note the 5 security group limit for instances in a private subnet:
    // GuCDK attaches one (HTTPS egress), leaving room for at most four here.
    const apiSecurityGroupIds =
      this.stage === "PROD"
        ? [...stageConfigs.PROD.accessToApiSecurityGroupIds, ...stageConfigs.CODE.accessToApiSecurityGroupIds]
        : stageConfigs.CODE.accessToApiSecurityGroupIds;

        const ecsService = loadBalancedApp.ecsService;
        if (!ecsService) {
            throw new Error("Flexible restorer requires an ECS service for API access configuration");
      }

        const cfnEcsService = ecsService.node.defaultChild;
        if (!(cfnEcsService instanceof CfnService)) {
            throw new Error("Flexible restorer requires an ECS CloudFormation service for API access configuration");
        }
        cfnEcsService.addPropertyOverride("NetworkConfiguration.AwsvpcConfiguration.SecurityGroups", [
            ...ecsService.connections.securityGroups.map(({ securityGroupId }) => securityGroupId),
            ...apiSecurityGroupIds,
        ]);

    if (this.stage === "CODE") {
      const panDomainPaths = panDomainSettingsPaths("local.dev-gutools.co.uk")
        .concat([panDomainKeysPath])

      new GuDeveloperPolicy(this, "RestorerAppLocalRunPolicy", {
        grantId: "run-flexible-restorer-locally",
        friendlyName: "Run Restorer Locally",
        // Checks reject any Allow whose resource contains a wildcard, which every
        // scoped-prefix resource below does.
        withoutPolicyChecks: true,
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["ssm:GetParameters", "ssm:GetParametersByPath"],
            resources: [`arn:aws:ssm:*:*:parameter/flexible/restorer/DEV*`],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:GetObject"],
            resources: [
              ...panDomainPaths.map((path) => `arn:aws:s3:::pan-domain-auth-settings/${path}`),
              `arn:aws:s3:::permissions-cache/${permissionsCachePath("CODE")}`, // LOCAL uses CODE permissions cache
              ...snapshotBuckets.map((bucket) => `arn:aws:s3:::${bucket}/*`),
            ],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:ListBucket"],
            resources: snapshotBuckets.map((bucket) => `arn:aws:s3:::${bucket}`),
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["kms:Decrypt", "kms:DescribeKey"],
            resources: [kmsKeyArn],
          })
        ],
      });
    }

    // The DNS record is managed in NS1 via GuCname. TTL is kept low while the
    // cutover from the legacy ELB soaks, so rollback propagates quickly; raise
    // it again once confident.
    new GuCname(this, "DnsRecord", {
      app,
      domainName: stageConfig.domainName,
      ttl: Duration.seconds(60),
      // Trailing dot to match NS1 records fully-qualified format.
      resourceRecord: `${loadBalancedApp.loadBalancer.loadBalancerDnsName}.`,
    });
  }
}
