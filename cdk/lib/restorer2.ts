import { AccessScope } from "@guardian/cdk/lib/constants";
import type { GuStackProps } from "@guardian/cdk/lib/constructs/core";
import { GuStack } from "@guardian/cdk/lib/constructs/core";
import { GuCname } from "@guardian/cdk/lib/constructs/dns";
import { GuVpc } from "@guardian/cdk/lib/constructs/ec2";
import { GuAllowPolicy } from "@guardian/cdk/lib/constructs/iam";
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

    // Shared VPC/subnet and KMS parameters. These previously lived in the
    // hand-written CloudFormation template (removed in phase 4); keep them as
    // stack parameters with the same logical names and defaults.
    const vpcId = new CfnParameter(this, "VpcId", {
      type: "AWS::EC2::VPC::Id",
      default: "vpc-381fa95d",
      description: "ID of the VPC onto which to launch the application eg. vpc-1234abcd",
    });
    const publicVpcSubnets = new CfnParameter(this, "PublicVpcSubnets", {
      type: "List<AWS::EC2::Subnet::Id>",
      default: "subnet-c3620fa6,subnet-2b37bd5c",
      description: "Subnets to use in VPC for public internet-facing ELB eg. subnet-abcd1234",
    });
    const privateVpcSubnets = new CfnParameter(this, "PrivateVpcSubnets", {
      type: "List<AWS::EC2::Subnet::Id>",
      default: "subnet-c2620fa7,subnet-2a37bd5d",
      description: "Subnets to use in VPC for private EC2 instances eg. subnet-abcd1234",
    });
    const kmsKeyArnParameter = new CfnParameter(this, "KmsKeyARN", {
      type: "String",
      description: "ARN of KMS key that was used to encrypt the backups",
    });

    const stageConfig = stageConfigs[this.stage as "CODE" | "PROD"];

    const vpc = GuVpc.fromId(this, "Vpc", {
      vpcId: vpcId.valueAsString,
    });
    const privateSubnets = GuVpc.subnets(this, privateVpcSubnets.valueAsList);
    const publicSubnets = GuVpc.subnets(this, publicVpcSubnets.valueAsList);

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

    // GuInstanceRole (created by GuEc2App) already grants ec2:DescribeInstances,
    // ec2:DescribeTags and autoscaling:Describe* (via GuDescribeEC2Policy), SSM
    // SSH access, parameter-store reads and Kinesis log shipping. Only the
    // app-specific permissions from the legacy template need porting here.
    // (The app itself only calls S3; the config/identity library needs
    // ec2:DescribeTags, which GuInstanceRole covers.)
    const additionalPolicies = [
      new GuAllowPolicy(this, "RestorerSSMPolicy", {
        actions: ["ssm:GetParameters", "ssm:GetParametersByPath"],
        resources: [`arn:aws:ssm:*:*:parameter/flexible/restorer/${this.stage}*`],
      }),
      new GuAllowPolicy(this, "RestorerGetDistributablesPolicy", {
        actions: ["s3:GetObject"],
        resources: ["arn:aws:s3:::composer-dist/*"],
      }),
      new GuAllowPolicy(this, "PanDomainPolicy", {
        actions: ["s3:GetObject"],
        resources: ["arn:aws:s3:::pan-domain-auth-settings/*"],
      }),
      new GuAllowPolicy(this, "PermissionsPolicy", {
        actions: ["s3:GetObject"],
        resources: ["arn:aws:s3:::permissions-cache/*"],
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
      new GuAllowPolicy(this, "RestorerCloudwatchPolicy", {
        actions: ["cloudwatch:*"],
        resources: ["*"],
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
      vpc,
      privateSubnets,
      publicSubnets,
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

    // Phase 3: manage the DNS record in NS1 via GuCname. It now points at the
    // new ALB, cutting traffic over from the legacy ELB. TTL is kept low during
    // the soak so rollback (repointing to the ELB) propagates quickly; raise it
    // again once confident.
    new GuCname(this, "DnsRecord", {
      app,
      domainName: stageConfig.domainName,
      ttl: Duration.seconds(60),
      // Trailing dot to match NS1 records fully-qualified format.
      resourceRecord: `${ec2App.loadBalancer.loadBalancerDnsName}.`,
    });
  }
}
