package logic

import java.util.Base64

import helpers.Loggable
import models._
import org.joda.time.DateTime
import play.api.libs.json.Json
import play.api.libs.ws.WSClient

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class FlexibleApi(wsClient: WSClient) extends Loggable {
  def changeDetails(stack: FlexibleStack, contentId: String): Future[Option[ChangeDetails]] = {
    wsClient.url(s"${stack.apiPrefix}/content/$contentId/changeDetails").get().map { response =>
      response.status match {
        case 200 =>
          val revision = (response.json \ "data" \ "revision").asOpt[Long]
          val lastModified = (response.json \ "data" \ "lastModified" \ "date").asOpt[Long].map(new DateTime(_))
          (revision, lastModified) match {
            case (Some(rev), Some(lm)) => Some(ChangeDetails(rev, lm))
            case _ => None
          }
        case _ => None
      }
    }
  }

  def restoreToExisting(stack: FlexibleStack, userHeader: (String, String), contentId: String, snapshot: Snapshot): Attempt[String] = {
    val attempt = Attempt.Async.Right(
      wsClient
        .url(s"${stack.apiPrefix}/restorer/content/$contentId")
        .withHttpHeaders(userHeader)
        .put(snapshot.data)
    )
    attempt.flatMap { response =>
      response.status match {
        case 204 => Attempt.Right(s"${stack.composerPrefix}/content/$contentId")
        case other => Attempt.Left(AttemptError(s"Failed to restore to existing: $other - ${response.body}"))
      }
    }
  }

  def restoreToNew(stack: FlexibleStack, userHeader: (String, String), contentId: String, snapshot: Snapshot): Attempt[String] = {
    val attempt = Attempt.Async.Right(
      wsClient
        .url(s"${stack.apiPrefix}/restorer/contentRaw/$contentId")
        .withHttpHeaders(userHeader)
        .put(snapshot.data)
    )
    attempt.flatMap { response =>
      response.status match {
        case 204 => Attempt.Right(s"${stack.composerPrefix}/content/$contentId")
        case other => Attempt.Left(AttemptError(s"Failed to restore to new: $other - ${response.body}"))
      }
    }
  }

  def restore(stack: FlexibleStack, user: User, contentId: String, snapshot: Snapshot): Attempt[String] = {
    val userString = Json.stringify(Json.toJson(user))

    // see https://github.com/guardian/flexible-content/pull/3130
    val userHeaderBase64 = "X-GU-User-base64" -> Base64.getEncoder.encodeToString(userString.getBytes("UTF-8"))

    restoreToExisting(stack, userHeaderBase64, contentId, snapshot).recoverWith { errors =>
      logger.info(s"Failed to restore $contentId to existing content in ${stack.displayName} - trying to upload new content ($errors)")
      restoreToNew(stack, userHeaderBase64, contentId, snapshot)
    }
  }
}
