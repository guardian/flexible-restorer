package controllers

import config.RestorerConfig
import models.{Attempt, SnapshotId}
import play.api.libs.ws.WSClient
import play.api.mvc.{Controller, Result}
import logic.{FlexibleApi, SnapshotStore}

import scala.concurrent.ExecutionContext.Implicits.global

class Restore(snapshotStores: Map[String, SnapshotStore], flexibleApi: FlexibleApi,
  val config: RestorerConfig, val wsClient: WSClient) extends Controller with PanDomainAuthActions {

  def restore(systemId: String, contentId: String, timestamp: String) = AuthAction.async {
    val store = snapshotStores(systemId)
    val snapshotId = SnapshotId(contentId, timestamp)
    val result = store.getSnapshot(snapshotId).flatMap[Result] {
      case None => Attempt.Right(NotFound)
      case Some(snapshot) => flexibleApi.restore(contentId, snapshot).map(Ok(_))
    }
    result.fold(
      errors => InternalServerError(s"Error whilst getting snapshot from store: $errors"),
      identity
    )
  }
}
