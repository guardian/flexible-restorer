package logic

import models.{Attempt, AttemptError, FlexibleStack, Snapshot}
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class FlexibleApi(wsClient: WSClient) {
  def latestRevision(stack: FlexibleStack, contentId: String): Future[Option[Long]] = {
    wsClient.url(s"${stack.apiPrefix}/content/$contentId/changeDetails").get().map { response =>
      response.status match {
        case 200 => (response.json \ "data" \ "revision").asOpt[Long]
        case _ => None
      }
    }
  }

  def restore(stack: FlexibleStack, contentId: String, snapshot: Snapshot): Attempt[String] = {
    val attempt = Attempt.Async.Right(wsClient.url(s"${stack.apiPrefix}/restorer/content/$contentId").put(snapshot.data))
    attempt.flatMap { response =>
      response.status match {
        case 204 => Attempt.Right(s"${stack.composerPrefix}/content/$contentId")
        case other => Attempt.Left(AttemptError(s"Failed to restore: $other - ${response.body}"))
      }
    }
  }
}
