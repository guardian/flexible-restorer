package controllers

import com.gu.pandomainauth.model.{User => PandaUser}
import config.RestorerConfig
import models._
import play.api.libs.ws.WSClient
import play.api.mvc.{Controller, Result}
import logic.{FlexibleApi, SnapshotApi}
import play.api.libs.json.Json

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class Restore(snapshotApi: SnapshotApi, flexibleApi: FlexibleApi, val config: RestorerConfig, val wsClient: WSClient) extends Controller with PanDomainAuthActions {

  def userFromPandaUser(user: PandaUser) = User(user.firstName, user.lastName, user.email)

  def restore(sourceId: String, contentId: String, timestamp: String, destinationId: String) = AuthAction.async { request =>
    val user = userFromPandaUser(request.user)
    val sourceStack = config.stackFromId(sourceId)
    val targetStack = config.stackFromId(destinationId)
    val snapshotId = SnapshotId(contentId, timestamp)
    val result = snapshotApi.getSnapshot(sourceStack.snapshotBucket, snapshotId).flatMap[Result] {
      case None => Attempt.Right(NotFound)
      case Some(snapshot) => flexibleApi.restore(targetStack, user, contentId, snapshot).map(Ok(_))
    }
    result.fold(
      errors => InternalServerError(s"Error whilst restoring: $errors"),
      identity
    )
  }

  def restoreDestinations(contentId: String) = AuthAction.async {
    val destinations = config.allStacks.map { stack =>
      val latestRevision = flexibleApi.latestRevision(stack, contentId)
      latestRevision.map { revision =>
        Destination(stack.id, stack.displayName, stack.stage, stack.stack,
          stack.composerPrefix, stack.isSecondary, revision)
      }
    }
    Future.sequence(destinations).map(d => Ok(Json.toJson(d)))
  }
}
