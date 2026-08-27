import { AccessScope } from "@guardian/cdk/lib/constants";
import type { GuStackProps } from "@guardian/cdk/lib/constructs/core";
import { GuStack } from "@guardian/cdk/lib/constructs/core";
import { GuCname } from "@guardian/cdk/lib/constructs/dns";
import { GuAllowPolicy, GuGetS3ObjectsPolicy } from "@guardian/cdk/lib/constructs/iam";
import { GuEc2App } from "@guardian/cdk/lib/patterns/ec2-app";
import type { App } from "aws-cdk-lib";
import { CfnParameter, Duration } from "aws-cdk-lib";
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, UserData } from "aws-cdk-lib/aws-ec2";

const app = "restorer2";

interface StageConfig {
  domainName: string;
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
    snapshotBucketSuffix: "code",
    accessToApiSecurityGroupIds: ["sg-4d028336", "sg-3137fa4b"],
  },
  PROD: {
    domainName: "restorer.gutools.co.uk",
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

    const userData = UserData.forLinux();
    userData.addCommands(
      `aws s3 cp s3://composer-dist/flexible/${this.stage}/${app}/${app}.deb /tmp/${app}.deb`,
      `dpkg -i /tmp/${app}.deb`,
    );

    const snapshotBuckets = [
      `flexible-snapshotter-${stageConfig.snapshotBucketSuffix}`,
      `flexible-secondary-snapshotter-${stageConfig.snapshotBucketSuffix}`,
    ];

    // Only app-specific permissions are needed here: GuInstanceRole (created by
    // GuEc2App) already grants ec2:DescribeInstances, ec2:DescribeTags and
    // autoscaling:Describe* (via GuDescribeEC2Policy), SSM SSH access,
    // parameter-store reads and Kinesis log shipping.
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
      }),
      new GuGetS3ObjectsPolicy(this, "PermissionsPolicy", {
        bucketName: "permissions-cache",
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

    const ec2App = new GuEc2App(this, {
      app,
      access: { scope: AccessScope.PUBLIC },
      applicationPort: 9000,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
      instanceMetricGranularity: "5Minute",
      monitoringConfiguration: { noMonitoring: true },
      applicationLogging: { enabled: true },
      imageRecipe: "editorial-tools-jammy-java11",
      userData,
      certificateProps: { domainName: stageConfig.domainName },
      scaling: { minimumInstances: 2, maximumInstances: 4 },
      healthcheck: { path: "/management/healthcheck" },
      additionalPolicies,
    });

    // Allow the restorer instances to reach the flexible-content API ELBs.
    // PROD additionally needs access to the CODE API (to restore content into
    // CODE). Note the 5 security group limit for instances in a private subnet:
    // GuCDK attaches one (HTTPS egress), leaving room for at most four here.
    const apiSecurityGroupIds =
      this.stage === "PROD"
        ? [...stageConfigs.PROD.accessToApiSecurityGroupIds, ...stageConfigs.CODE.accessToApiSecurityGroupIds]
        : stageConfigs.CODE.accessToApiSecurityGroupIds;

    apiSecurityGroupIds.forEach((securityGroupId, index) => {
      ec2App.autoScalingGroup.instanceLaunchTemplate.connections.addSecurityGroup(
        SecurityGroup.fromSecurityGroupId(this, `AccessToApiSecurityGroup${index}`, securityGroupId, {
          mutable: false,
        }),
      );
    });

    // The DNS record is managed in NS1 via GuCname. TTL is kept low while the
    // cutover from the legacy ELB soaks, so rollback propagates quickly; raise
    // it again once confident.
    new GuCname(this, "DnsRecord", {
      app,
      domainName: stageConfig.domainName,
      ttl: Duration.seconds(60),
      // Trailing dot to match NS1 records fully-qualified format.
      resourceRecord: `${ec2App.loadBalancer.loadBalancerDnsName}.`,
    });
  }
}
