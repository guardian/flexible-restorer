package config

import com.amazonaws.auth.profile.{ProfileCredentialsProvider => ProfileCredentialsProviderV1}
import com.amazonaws.auth.{AWSCredentialsProviderChain, InstanceProfileCredentialsProvider => InstanceProfileCredentialsProviderV1}
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import software.amazon.awssdk.auth.credentials.{AwsCredentialsProviderChain, InstanceProfileCredentialsProvider, ProfileCredentialsProvider}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

object AWS {
  lazy val profile = "composer"

  lazy val defaultStack = "flexible"
  lazy val defaultAppName = "restorer"
  lazy val defaultRegion: Region = Region.EU_WEST_1

  val credentials: AwsCredentialsProviderChain = AwsCredentialsProviderChain.builder().credentialsProviders(
    ProfileCredentialsProvider.create(profile),
    InstanceProfileCredentialsProvider.create()
  ).build()

  lazy val s3Client: S3Client = S3Client.builder().credentialsProvider(credentials).region(defaultRegion).build()

  // TODO: Remove AWS SDK V1 objects once dependent libraries have been updated to SDK V2
  val credentialsV1 = new AWSCredentialsProviderChain(
    new ProfileCredentialsProviderV1(profile),
    InstanceProfileCredentialsProviderV1.getInstance()
  )
  val S3ClientV1: AmazonS3 = AmazonS3ClientBuilder.standard().withCredentials(credentialsV1).withRegion(Regions.EU_WEST_1).build()
}
