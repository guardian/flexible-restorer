package controllers

import config.RestorerConfig
import helpers.Loggable
import models.{SnapshotId, VersionCount}
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._
import s3.SnapshotStore

import scala.language.postfixOps

class Versions(val config: RestorerConfig, snapshotStores: Map[String, SnapshotStore], override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(systemId: String, contentId: String, timestamp: String) = AuthAction {
    val store = snapshotStores(systemId)
    val snapshot = store.getRawSnapshot(SnapshotId(contentId, timestamp))
    snapshot match {
      case Right(ss) => Ok(ss).as(JSON)
      case Left(error) => NotFound(error)
    }
  }

  def versionList(contentId: String) = AuthAction {
    val snapshotsWithMetadata = snapshotStores.flatMap { case (systemId, store) =>
      val snapshots = store.listForId(contentId)
      snapshots.map { snapshotId =>
        val identifier = Json.toJson(snapshotId).asInstanceOf[JsObject]
        val info: JsValue = store.getSnapshotInfo(snapshotId).right.toOption.getOrElse(JsObject(Nil))
        identifier ++ Json.obj("systemId" -> systemId, "info" -> info)
      }
    }
    Ok(Json.toJson(snapshotsWithMetadata))
  }

  def availableVersionsCount(contentId: String) = AuthAction {
    val storeCounts: Iterable[Int] = snapshotStores.values.map(_.listForId(contentId).size)
    val count = VersionCount(contentId, storeCounts.sum)
    Ok(Json.toJson(count))
  }
}
