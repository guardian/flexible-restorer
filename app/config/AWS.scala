package config

import software.amazon.awssdk.auth.credentials.{
  AwsCredentialsProviderChain,
  InstanceProfileCredentialsProvider,
  ProfileCredentialsProvider
}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration

import java.net.URI

object AWS {
  lazy val profile = "composer"

  lazy val defaultStack = "flexible"
  lazy val defaultAppName = "restorer"
  lazy val defaultRegion: Region = Region.EU_WEST_1
  lazy val s3EndpointOverride: Option[URI] =
    sys.env.get("S3_ENDPOINT").map(URI.create)
  lazy val s3PathStyleAccess: Boolean = sys.env
    .get("S3_PATH_STYLE_ACCESS")
    .exists(_.toBoolean) || s3EndpointOverride.isDefined

  val credentials: AwsCredentialsProviderChain = AwsCredentialsProviderChain
    .builder()
    .credentialsProviders(
      ProfileCredentialsProvider.create(profile),
      InstanceProfileCredentialsProvider.create()
    )
    .build()

  lazy val s3Client: S3Client = {
    val builder = S3Client
      .builder()
      .credentialsProvider(credentials)
      .region(defaultRegion)
      .serviceConfiguration(
        S3Configuration
          .builder()
          .pathStyleAccessEnabled(s3PathStyleAccess)
          .build()
      )

    s3EndpointOverride.foreach(builder.endpointOverride)

    builder.build()
  }
}
