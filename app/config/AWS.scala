package config

import software.amazon.awssdk.auth.credentials.{
  AwsCredentialsProviderChain,
  EnvironmentVariableCredentialsProvider,
  InstanceProfileCredentialsProvider,
  ProfileCredentialsProvider
}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration

object AWS {
  lazy val profile = "composer"

  lazy val defaultStack = "flexible"
  lazy val defaultAppName = "restorer"
  lazy val defaultRegion: Region = Region.EU_WEST_1
  lazy val s3PathStyleAccess: Boolean = sys.env
    .get("S3_PATH_STYLE_ACCESS")
    .exists(_.toBoolean) ||
    sys.env.get("AWS_ENDPOINT_URL_S3").exists(_.nonEmpty) ||
    sys.env.get("AWS_ENDPOINT_URL").exists(_.nonEmpty)

  val credentials: AwsCredentialsProviderChain = AwsCredentialsProviderChain
    .builder()
    .credentialsProviders(
      EnvironmentVariableCredentialsProvider.create(),
      ProfileCredentialsProvider.create(profile),
      InstanceProfileCredentialsProvider.create()
    )
    .build()

  lazy val s3Client: S3Client = {
    S3Client
      .builder()
      .credentialsProvider(credentials)
      .region(defaultRegion)
      .serviceConfiguration(
        S3Configuration
          .builder()
          .pathStyleAccessEnabled(s3PathStyleAccess)
          .build()
      )
      .build()
  }
}
