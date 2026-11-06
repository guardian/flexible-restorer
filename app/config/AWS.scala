package config

import software.amazon.awssdk.auth.credentials.{AwsCredentialsProvider, AwsCredentialsProviderChain, DefaultCredentialsProvider, ProfileCredentialsProvider}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

object AWS {
  lazy val profile = "composer"

  lazy val defaultStack = "flexible"
  lazy val defaultAppName = "restorer"
  lazy val defaultRegion: Region = Region.EU_WEST_1

  val credentials: AwsCredentialsProvider = {

    val defaultProvider = DefaultCredentialsProvider
      .builder()
      .build()

    val profileProvider = ProfileCredentialsProvider
      .builder()
      .profileName(profile)
      .build()

    AwsCredentialsProviderChain
      .builder()
      .addCredentialsProvider(defaultProvider)
      .addCredentialsProvider(profileProvider)
      .build()
  }

  lazy val s3Client: S3Client = S3Client
    .builder()
    .credentialsProvider(credentials)
    .region(defaultRegion)
    .build()
}
