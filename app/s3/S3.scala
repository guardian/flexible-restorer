package s3

import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import config._
import helpers.Loggable

import scala.collection.JavaConverters._
import scala.io.Source

case class Snapshot(timestamp: String, key: String)

class S3(config: RestorerConfig, s3Client: AmazonS3Client) extends Loggable {
  lazy val snapshotBucket: String = config.snapshotBucket

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

  private val TimestampRegEx = """[0-9a-f]{24}/(.*).json""".r
  private val timestampFromKey: String => Option[String] = {
    case TimestampRegEx(timestamp) => Some(timestamp)
    case _ => None
  }

  private def listSnapshots(bucket: String, id: String): List[Snapshot] = {
    logger.info(s"Looking for snapshots of $id in $bucket")
    val request = new ListObjectsRequest().withBucketName(bucket).withPrefix(id)
    val listing = s3Client.listObjects(request)

    val objectKeys = listing.getObjectSummaries.asScala.map(x => x.getKey).toList
    logger.info(s"Found ${objectKeys.size} versions")
    objectKeys.flatMap { k => timestampFromKey(k).map(Snapshot(_, k)) }
  }

  val listForId: String => List[Snapshot] = id => listSnapshots(snapshotBucket, id)
}
