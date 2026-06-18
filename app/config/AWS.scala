package config

import software.amazon.awssdk.auth.credentials.{
  AwsCredentialsProviderChain,
  EnvironmentVariableCredentialsProvider,
  InstanceProfileCredentialsProvider,
  ProfileCredentialsProvider
}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

object AWS {
  lazy val profile = "composer"

  lazy val defaultStack = "flexible"
  lazy val defaultAppName = "restorer"
  lazy val defaultRegion: Region = Region.EU_WEST_1

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
      .build()
  }
}
