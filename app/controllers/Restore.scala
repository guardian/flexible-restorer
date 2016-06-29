package controllers

import java.util.concurrent.TimeoutException

import com.gu.pandomainauth.model.{User => PandaUser}
import config.RestorerConfig
import helpers.Loggable
import logic.{FlexibleApi, SnapshotApi}
import models._
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc.{Controller, Result}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._
import scala.concurrent.{Await, Future}
import scala.language.postfixOps
import scala.util.control.NonFatal

class Restore(snapshotApi: SnapshotApi, flexibleApi: FlexibleApi, val config: RestorerConfig, val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {

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
      val destination = Destination(stack.id, stack.displayName, stack.stage, stack.stack,
          stack.composerPrefix, stack.isSecondary, None, available = false)

      try {
        val latestRevision = Await.ready(flexibleApi.latestRevision(stack, contentId), 3 seconds)
        latestRevision.map { revision =>
          destination.withApiStatus(revision, available = true)
        } recover {
          // if we fail to talk to the stack's API for any reason then provide a destination with available set to false
          case NonFatal(e) =>
            logger.warn(s"Couldn't communicate with Flexible stack at ${stack.apiPrefix}", e)
            destination
        }
      } catch {
        case e:TimeoutException => Future.successful(destination)
      }
    }
    Future.sequence(destinations).map(d => Ok(Json.toJson(d)))
  }
}
