package logic

import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model._
import helpers.Loggable
import models.{Attempt, AttemptError, Snapshot, SnapshotId}
import play.api.libs.json.{JsValue, Json}

import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.io.Source
import scala.util.control.NonFatal

class SnapshotApi(s3Client: AmazonS3Client) extends Loggable {
  def listForId(bucket: String, id: String): List[SnapshotId] = listSnapshots(bucket, id)

  def getRawSnapshot(bucket: String, snapshotId: SnapshotId) = getObjectContentRaw(snapshotId.key, bucket)

  def getSnapshot(bucket: String, snapshotId: SnapshotId): Attempt[Option[Snapshot]] = {
    getObjectContentJson(snapshotId.key, bucket).map { _.map(Snapshot(snapshotId, _)) }
  }

  def getRawSnapshotInfo(bucket: String, snapshotId: SnapshotId) = getObjectContentRaw(snapshotId.infoKey, bucket)

  def getSnapshotInfo(bucket: String, snapshotId: SnapshotId): Attempt[Option[JsValue]] =
    getObjectContentJson(snapshotId.infoKey, bucket)

  private def getObject(key: String, bucketName: String): Attempt[Option[S3Object]] = {
    try {
      Attempt.Right(Some(s3Client.getObject(new GetObjectRequest(bucketName, key))))
    } catch {
      case e:AmazonS3Exception if e.getErrorCode == "NoSuchKey" =>
        Attempt.Right(None)
      case NonFatal(e) =>
        logger.warn(s"Unexpected error whilst getting object $bucketName:$key", e)
        Attempt.Left(AttemptError(s"Couldn't retrieve object: ${e.getMessage}"))
    }
  }

  // Get object contents and ensure stream is closed
  private def getObjectContentRaw(key: String, bucketName: String): Attempt[Option[String]] = {
    getObject(key, bucketName).map {
      _.map { obj =>
        try {
          Source.fromInputStream(obj.getObjectContent, "UTF-8").mkString
        } finally {
          obj.close()
        }
      }
    }
  }

  private def getObjectContentJson(key: String, bucketName: String): Attempt[Option[JsValue]] = {
    getObject(key, bucketName).map {
      _.map { obj =>
        try {
          Json.parse(obj.getObjectContent)
        } finally {
          obj.close()
        }
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
}
