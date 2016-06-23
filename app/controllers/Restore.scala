package controllers

import config.RestorerConfig
import models.SnapshotId
import play.api.libs.ws.WSClient
import play.api.mvc.Controller
import s3.SnapshotStore

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class Restore(snapshotStores: Map[String, SnapshotStore], val config: RestorerConfig, val wsClient: WSClient)
  extends Controller with PanDomainAuthActions {

  def restore(systemId: String, contentId: String, timestamp: String) = AuthAction.async {
    val store = snapshotStores(systemId)
    val snapshotId = SnapshotId(contentId, timestamp)
    store.getSnapshot(snapshotId) match {
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
