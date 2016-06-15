package controllers

import config.RestorerConfig
import helpers.Loggable
import models.{SnapshotId, Version, VersionCount}
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._
import s3.S3

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

class Versions(val config: RestorerConfig, s3Helper: S3, override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(contentId: String, timestamp: String) = AuthAction {
    val snapshot = s3Helper.getRawSnapshot(SnapshotId(contentId, timestamp))
    Ok(snapshot).as(JSON)
  }

  def versions(contentId: String) = AuthAction {
    logger.info(s"Getting JSON versions for $contentId")
    val snapshots = s3Helper.listForId(contentId)
    val versions = snapshots.map{ s =>
      Version(s.timestamp, Json.parse(s3Helper.getRawSnapshot(s)))
    }
    Ok(Json.toJson(versions))
  }

  def availableVersionsCount(contentId: String) = AuthAction {
    val count = VersionCount(contentId, s3Helper.listForId(contentId).size)
    Ok(Json.toJson(count))
  }

  def restore(contentId: String, timestamp: String) = AuthAction.async {
    val snapshotId = SnapshotId(contentId, timestamp)
    s3Helper.getSnapshot(snapshotId) match {
      case Left(error) =>
        Future.successful(InternalServerError(s"Error whilst getting snapshot from store: $error"))
      case Right(snapshot) =>
        // now push this snapshot into the API
        wsClient.url(s"${config.flexibleApi}/restorer/content/$contentId").put(snapshot.data).map { response =>
          response.status match {
            case 204 => NoContent
            case other => Status(other)(response.body)
          }
        }
    }
  }
}
