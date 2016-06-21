package controllers

import config.RestorerConfig
import helpers.Loggable
import models.{SnapshotId, VersionCount}
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._
import s3.S3

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.language.postfixOps

class Versions(val config: RestorerConfig, s3Helper: S3, override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(contentId: String, timestamp: String) = AuthAction {
    val snapshot = s3Helper.getRawSnapshot(SnapshotId(contentId, timestamp))
    snapshot match {
      case Right(ss) => Ok(ss).as(JSON)
      case Left(error) => NotFound(error)
    }
  }

  def versionList(contentId: String) = AuthAction {
    val snapshots = s3Helper.listForId(contentId)
    val snapshotsWithMetadata = snapshots.map { snapshotId =>
      val identifier = Json.toJson(snapshotId).asInstanceOf[JsObject]
      val info = s3Helper.getSnapshotInfo(snapshotId).right.map(_.asInstanceOf[JsObject])
      info.fold(_ => identifier, json => identifier ++ json)
    }
    Ok(Json.toJson(snapshotsWithMetadata))
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
