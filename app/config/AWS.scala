package config

import com.amazonaws.regions.Regions
import com.amazonaws.services.cloudwatch.{AmazonCloudWatchAsync, AmazonCloudWatchAsyncClientBuilder}
import com.amazonaws.services.ec2.model.{DescribeTagsRequest, Filter}
import com.amazonaws.services.ec2.{AmazonEC2, AmazonEC2ClientBuilder}
import com.amazonaws.util.EC2MetadataUtils

import scala.collection.JavaConverters._

object AWS {

  lazy val region: Regions = Regions.EU_WEST_1

  lazy val EC2Client: AmazonEC2 = AmazonEC2ClientBuilder.standard().withRegion(region).build()
  lazy val CloudWatch: AmazonCloudWatchAsync = AmazonCloudWatchAsyncClientBuilder.standard().withRegion(region).build()

}

trait AwsInstanceTags {
  lazy val instanceId = Option(EC2MetadataUtils.getInstanceId)

  def readTag(tagName: String) = {
    instanceId.flatMap { id =>
      val tagsResult = AWS.EC2Client.describeTags(
        new DescribeTagsRequest().withFilters(
          new Filter("resource-type").withValues("instance"),
          new Filter("resource-id").withValues(id),
          new Filter("key").withValues(tagName)
        )
      )
      tagsResult.getTags.asScala.find(_.getKey == tagName).map(_.getValue)
    }
  }
}
