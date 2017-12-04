package controllers

import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotApi
import models.{Attempt, SnapshotId, VersionCount}
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext
import scala.concurrent.ExecutionContext.Implicits.global

class Versions(val controllerComponents: ControllerComponents, val config: RestorerConfig, snapshotApi: SnapshotApi, override val wsClient: WSClient)
  extends BaseController with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(systemId: String, contentId: String, timestamp: String) = AuthAction.async {
    val stack = config.stackFromId(systemId)
    val snapshot = snapshotApi.getRawSnapshot(stack.snapshotBucket, SnapshotId(contentId, timestamp))
    snapshot.fold(
      { failure => InternalServerError(failure.toString) },
      {
        case Some(ss) => Ok(ss).as(JSON)
        case None => NotFound
      }
    )
  }

  def versionList(contentId: String) = AuthAction.async {
    val snapshotsWithMetadata = Attempt.successfulAttempts(config.sourceStacks.flatMap { stack =>
      val snapshots = snapshotApi.listForId(stack.snapshotBucket, contentId)
      snapshots.map { snapshotId =>
        val identifier = Json.toJson(snapshotId).asInstanceOf[JsObject]
        val info: Attempt[JsValue] =
          for (
            snapshotInfo <- snapshotApi.getSnapshotInfo(stack.snapshotBucket, snapshotId)
          ) yield {
            snapshotInfo.getOrElse(JsObject(Nil))
          }
        info.map { infoJson =>
          identifier ++ Json.obj(
            "system" -> Json.obj(
              "id" -> stack.id,
              "isSecondary" -> stack.isSecondary,
              "composerPrefix" -> stack.composerPrefix
            ),
            "info" -> infoJson
          )
        }
      }
    })
    snapshotsWithMetadata.fold(errors => InternalServerError(errors.toString), snapshots => Ok(Json.toJson(snapshots)))
  }

  def availableVersionsCount(contentId: String) = AuthAction {
    val storeCounts = config.sourceStacks.map{ stack =>
      snapshotApi.listForId(stack.snapshotBucket, contentId).size
    }
    val count = VersionCount(contentId, storeCounts.sum)
    Ok(Json.toJson(count))
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
