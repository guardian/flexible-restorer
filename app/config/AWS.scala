package config

import com.amazonaws.auth.profile.{ProfileCredentialsProvider => ProfileCredentialsProviderV1}
import com.amazonaws.auth.{AWSCredentialsProviderChain, InstanceProfileCredentialsProvider => InstanceProfileCredentialsProviderV1}
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import software.amazon.awssdk.auth.credentials.{AwsCredentialsProviderChain, InstanceProfileCredentialsProvider, ProfileCredentialsProvider}
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.regions.internal.util.EC2MetadataUtils
import software.amazon.awssdk.services.ec2.Ec2Client
import software.amazon.awssdk.services.ec2.model.{DescribeTagsRequest, DescribeTagsResponse, Filter}
import software.amazon.awssdk.services.s3.S3Client

import scala.collection.JavaConverters._

object AWS extends AwsInstanceTags {

  lazy val profile = "composer"
  lazy val stackName = "flexible"
  lazy val app = "restorer"

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }
  lazy val effectiveStage: String = stage match {
    case "DEV" => "CODE" // use CODE when in development mode
    case value => value
  }

  lazy val region: Region = Region.EU_WEST_1

  val credentials: AwsCredentialsProviderChain = AwsCredentialsProviderChain.builder().credentialsProviders(
    ProfileCredentialsProvider.create(profile),
    InstanceProfileCredentialsProvider.create()
  ).build()

  lazy val EC2Client: Ec2Client = Ec2Client.builder().credentialsProvider(credentials).region(region).build()
  lazy val s3Client: S3Client = S3Client.builder().credentialsProvider(credentials).region(region).build()

  // TODO: Remove AWS SDK V1 objects once dependent libraries have been updated
  val credentialsV1 = new AWSCredentialsProviderChain(
    new ProfileCredentialsProviderV1(profile),
    InstanceProfileCredentialsProviderV1.getInstance()
  )
  val S3ClientV1: AmazonS3 = AmazonS3ClientBuilder.standard().withCredentials(credentialsV1).withRegion(Regions.EU_WEST_1).build()
}

trait AwsInstanceTags {
  lazy val instanceId: Option[String] = Option(EC2MetadataUtils.getInstanceId)

  def readTag(tagName: String): Option[String] = {
    instanceId flatMap { id =>
      val tagsResponse: DescribeTagsResponse = AWS.EC2Client.describeTags(

        DescribeTagsRequest.builder().filters(
          Filter.builder().name("resource-type").values("instance").build(),
          Filter.builder().name("resource-id").values(id).build(),
          Filter.builder().name("key").values(tagName).build()
        ).build()
      )
      tagsResponse.tags().asScala.find(_.key() == tagName).map(_.value())
    }
  }
}
