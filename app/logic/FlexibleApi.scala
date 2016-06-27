package logic

import config.FlexibleStack
import models.{Attempt, AttemptError, Snapshot}
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global

class FlexibleApi(stack: FlexibleStack, wsClient: WSClient) {
  def restore(contentId: String, snapshot: Snapshot): Attempt[String] = {
    val attempt = Attempt.Async.Right(wsClient.url(s"${stack.apiPrefix}/restorer/content/$contentId").put(snapshot.data))
    attempt.flatMap { response =>
      response.status match {
        case 204 => Attempt.Right(s"${stack.composerPrefix}/content/$contentId")
        case other => Attempt.Left(AttemptError(s"Failed to restore: $other - ${response.body}"))
      }
    }
  }
}
