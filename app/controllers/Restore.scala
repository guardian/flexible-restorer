package controllers

import config.RestorerConfig
import models.{Attempt, Destination, FlexibleStack, SnapshotId}
import play.api.libs.ws.WSClient
import play.api.mvc.{Controller, Result}
import logic.{FlexibleApi, SnapshotApi}
import play.api.libs.json.Json

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class Restore(snapshotApi: SnapshotApi, flexibleApi: FlexibleApi, val config: RestorerConfig, val wsClient: WSClient) extends Controller with PanDomainAuthActions {

  def restore(sourceId: String, contentId: String, timestamp: String, destinationId: String) = AuthAction.async {
    val sourceStack = config.stackFromId(sourceId)
    val targetStack = config.stackFromId(destinationId)
    val snapshotId = SnapshotId(contentId, timestamp)
    val result = snapshotApi.getSnapshot(sourceStack.snapshotBucket, snapshotId).flatMap[Result] {
      case None => Attempt.Right(NotFound)
      case Some(snapshot) => flexibleApi.restore(targetStack, contentId, snapshot).map(Ok(_))
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
