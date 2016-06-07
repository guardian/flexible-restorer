package s3

import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import config._
import helpers.Loggable

import scala.collection.JavaConverters._
import scala.io.Source

class S3 extends Loggable {
  lazy val config = RestorerConfig

  lazy val snapshotBucket: String = config.snapshotBucket

  val s3Client = new AmazonS3Client(config.creds)

  def getSnapshot(key: String): String = getObjectContents(key, snapshotBucket)

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

  private def listSnapshots(bucket: String, id: String): List[String] = {
    logger.info(s"Looking for snapshots of $id in $bucket")
    val request = new ListObjectsRequest().withBucketName(bucket).withPrefix(id)
    val listing = s3Client.listObjects(request)

    val objects = listing.getObjectSummaries.asScala.map(x => x.getKey).toList
    logger.info(s"Found ${objects.size} versions")
    objects
  }

  val listForId: String => List[String] = id => listSnapshots(snapshotBucket, id)
}
