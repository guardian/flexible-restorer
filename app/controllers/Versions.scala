package controllers

import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotStore
import models.{Attempt, SnapshotId, VersionCount}
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.language.postfixOps

class Versions(val config: RestorerConfig, snapshotStores: Map[String, SnapshotStore], override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(systemId: String, contentId: String, timestamp: String) = AuthAction.async {
    val store = snapshotStores(systemId)
    val snapshot = store.getRawSnapshot(SnapshotId(contentId, timestamp))
    snapshot.fold(
      { failure => InternalServerError(failure.toString) },
      {
        case Some(ss) => Ok(ss).as(JSON)
        case None => NotFound
      }
    )
  }

  def versionList(contentId: String) = AuthAction.async {
    val snapshotsWithMetadata = Attempt.successfulAttempts(snapshotStores.toList.flatMap { case (systemId, store) =>
      val snapshots = store.listForId(contentId)
      snapshots.map { snapshotId =>
        val identifier = Json.toJson(snapshotId).asInstanceOf[JsObject]
        val info: Attempt[JsValue] =
          for (
            snapshotInfo <- store.getSnapshotInfo(snapshotId)
          ) yield {
            snapshotInfo.getOrElse(JsObject(Nil))
          }
        info.map { infoJson =>
          identifier ++ Json.obj("systemId" -> systemId, "info" -> infoJson)
        }
      }
    })
    snapshotsWithMetadata.fold(errors => InternalServerError(errors.toString), snapshots => Ok(Json.toJson(snapshots)))
  }

  def availableVersionsCount(contentId: String) = AuthAction {
    val storeCounts: Iterable[Int] = snapshotStores.values.map(_.listForId(contentId).size)
    val count = VersionCount(contentId, storeCounts.sum)
    Ok(Json.toJson(count))
  }
}
