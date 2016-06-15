package s3

import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import config._
import helpers.Loggable
import models.{Snapshot, SnapshotId}
import play.api.data.validation.ValidationError
import play.api.libs.json.{JsPath, Json}

import scala.collection.JavaConverters._
import scala.io.Source

class S3(config: RestorerConfig, s3Client: AmazonS3Client) extends Loggable {
  lazy val snapshotBucket: String = config.snapshotBucket

  def getRawSnapshot(snapshotId: SnapshotId): String = getObjectContents(snapshotId.key, snapshotBucket)

  def getSnapshot(snapshotId: SnapshotId): Either[Seq[(JsPath, Seq[ValidationError])], Snapshot] = {
    val obj = getObject(snapshotId.key, snapshotBucket)
    try {
      val json = Json.parse(obj.getObjectContent)
      Json.fromJson[Snapshot](json).asEither
    } finally {
      obj.close()
    }
  }

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

  private def listSnapshots(bucket: String, id: String): List[SnapshotId] = {
    logger.info(s"Looking for snapshots of $id in $bucket")
    val request = new ListObjectsRequest().withBucketName(bucket).withPrefix(id)
    val listing = s3Client.listObjects(request)

    val objectKeys = listing.getObjectSummaries.asScala.map(x => x.getKey).toList
    logger.info(s"Found ${objectKeys.size} versions")
    objectKeys.flatMap { k => SnapshotId.fromKey(k) }
  }

  val listForId: String => List[SnapshotId] = id => listSnapshots(snapshotBucket, id)
}
