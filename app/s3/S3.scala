package s3

import com.amazonaws.auth.{BasicAWSCredentials, DefaultAWSCredentialsProviderChain}
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import java.io.ByteArrayInputStream
import scala.collection.JavaConverters._
import org.joda.time.DateTime
import play.api.libs.json.Json
import config._
import com.gu.restorer.helpers.Loggable
import scala.io.Source

class S3 extends Loggable {
  import play.api.Play.current
  lazy val config = RestorerConfig

  lazy val draftBucket: String = config.draftBucket
  lazy val liveBucket: String = config.liveBucket

  val s3Client =
    config.creds.map { c =>
      new AmazonS3Client(c.awsApiCreds)
    } getOrElse {
      new AmazonS3Client(new DefaultAWSCredentialsProviderChain())
    }

  def getLiveSnapshot(key: String): String = getObjectContents(key, liveBucket)
  def getDraftSnapshot(key: String): String = getObjectContents(key, draftBucket)

  private def getObject(key: String, bucketName: String): S3Object = {
    s3Client.getObject(new GetObjectRequest(bucketName, key))
  }

  // Get object contents and ensure stream is closed
  def getObjectContents(key: String, bucketName: String): String = {
    val obj = getObject(key, bucketName)
    try {
      Source.fromInputStream(obj.getObjectContent, "UTF-8").mkString
    } finally {
      obj.close()
    }
  }

  private def listSnapshots(bucket: String, id: Option[String] = None): List[String] = {
    val request = new ListObjectsRequest().withBucketName(bucket)
    info("Getting snapshots on: %s for id: %s ".format(bucket, id))
    val requestWithId = id.map { i =>
      val key = idToKey(i)
      request.withPrefix(key)
    }.getOrElse(request)
    val objects = s3Client.listObjects(requestWithId)
    objects.getObjectSummaries.asScala.map(x => x.getKey).toList
  }

  val getObjects: ListObjectsRequest => ObjectListing = s3Client.listObjects(_)
  val objectRequest: String => ListObjectsRequest =
    new ListObjectsRequest().withBucketName(_)

  val listLiveForId: String => List[String] = id => listSnapshots(liveBucket, Some(id))
  val listDraftForId: String => List[String] = id => listSnapshots(draftBucket, Some(id))

  // helpers to make the objects more manageable
  private val getId: String => Option[String] = _.split("/").lift(6)
  private val idToKey: String => String = s =>
    s.substring(0, 6).split("").mkString("/").substring(1) + "/" + s


  def saveItem(bucket: String, id: String, item: String): PutObjectResult = {
    info("Saving item to: %s with id: %s".format(bucket, id))
    if(!s3Client.doesBucketExist(bucket)) {
      s3Client.createBucket(bucket, Region.EU_Ireland)
    }

    val contentLength = item.getBytes().length
    val metaData = new ObjectMetadata()
    metaData.setContentType("application/json; charset=utf-8")
    metaData.setContentLength(contentLength)
    s3Client.putObject(bucket, id, new ByteArrayInputStream(item.getBytes()), metaData)
  }
}
