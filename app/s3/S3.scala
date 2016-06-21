package s3

import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import config._
import helpers.Loggable
import models.{Snapshot, SnapshotId}
import play.api.libs.json.{JsValue, Json}

import scala.collection.JavaConverters._
import scala.io.Source
import scala.util.control.NonFatal

class S3(config: RestorerConfig, s3Client: AmazonS3Client) extends Loggable {
  lazy val snapshotBucket: String = config.snapshotBucket

  def getRawSnapshot(snapshotId: SnapshotId): Either[String, String] = getObjectContentRaw(snapshotId.key, snapshotBucket)

  def getSnapshot(snapshotId: SnapshotId): Either[String, Snapshot] = {
    getObjectContentJson(snapshotId.key, snapshotBucket).right.map { json =>
      Snapshot(snapshotId, json)
    }
  }

  def getRawSnapshotInfo(snapshotId: SnapshotId): Either[String, String] = getObjectContentRaw(snapshotId.infoKey, snapshotBucket)

  def getSnapshotInfo(snapshotId: SnapshotId): Either[String, JsValue] =
    getObjectContentJson(snapshotId.infoKey, snapshotBucket)

  private def getObject(key: String, bucketName: String): Either[String, S3Object] = {
    try {
      Right(s3Client.getObject(new GetObjectRequest(bucketName, key)))
    } catch {
      case e:AmazonS3Exception if e.getErrorCode == "NoSuchKey" =>
        Left("Object doesn't exist")
      case NonFatal(e) =>
        logger.warn("Unexpected error whilst getting object", e)
        Left(s"Couldn't retrieve object: ${e.getMessage}")
    }
  }

  // Get object contents and ensure stream is closed
  private def getObjectContentRaw(key: String, bucketName: String): Either[String, String] = {
    getObject(key, bucketName).right.map { obj =>
      try {
        Source.fromInputStream(obj.getObjectContent, "UTF-8").mkString
      } finally {
        obj.close()
      }
    }
  }

  private def getObjectContentJson(key: String, bucketName: String): Either[String, JsValue] = {
    getObject(key, snapshotBucket).right.map { obj =>
      try {
        Json.parse(obj.getObjectContent)
      } finally {
        obj.close()
      }
    }
  }

  private def listSnapshots(bucket: String, id: String): List[SnapshotId] = {
    logger.info(s"Looking for snapshots of $id in $bucket")
    val request = new ListObjectsRequest().withBucketName(bucket).withPrefix(id)
    val listing = s3Client.listObjects(request)

    val objectKeys = listing.getObjectSummaries.asScala.map(x => x.getKey).toList
    logger.info(s"Found ${objectKeys.size} versions")
    objectKeys.flatMap { k => SnapshotId.fromKey(k) }.distinct
  }

  val listForId: String => List[SnapshotId] = id => listSnapshots(snapshotBucket, id)
}
