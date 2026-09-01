package controllers

import auth.PanDomainAuthActions

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.pandomainauth.model.{User => PandaUser}
import com.gu.permissions.PermissionsProvider
import config.AppConfig
import helpers.Loggable
import logic.{FlexibleApi, SnapshotApi}
import models._
import permissions.Permissions
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContext, Future}
import scala.util.control.NonFatal

class Restore(
  val controllerComponents: ControllerComponents,
  snapshotApi: SnapshotApi,
  flexibleApi: FlexibleApi,
  val config: AppConfig,
  val wsClient: WSClient,
  override val permissions: PermissionsProvider,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with Loggable {

  def userFromPandaUser(user: PandaUser) = User(user.firstName, user.lastName, user.email)

  def restore(sourceId: String, contentId: String, timestamp: String, destinationId: String) = AuthAction.async { request =>
    if (!permissions.hasPermission(Permissions.RestoreContent, request.user.email)) {
      Future.successful(Forbidden(s"You do not have the ${Permissions.RestoreContent.name} permission which is required to restore content"))
    } else if (sourceId != destinationId && !permissions.hasPermission(Permissions.RestoreContentToAlternateStack, request.user.email)) {
      Future.successful(Forbidden(s"You do not have the ${Permissions.RestoreContentToAlternateStack.name} permission which is required to restore content from one stack to another"))
    } else {
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
  }

  def restoreDestinations(contentId: String) = AuthAction.async {
    // Query every stack concurrently and without blocking: each call carries its
    // own request timeout (see `FlexibleApi.changeDetails`) and fails fast to the
    // `recover` below, so a slow or unreachable stack never ties up a request
    // thread. Blocking here (previously `Await.ready` per stack) starved the
    // execution context under concurrent load and caused reachable stacks to be
    // spuriously reported as unavailable.
    val destinations = config.allStacks.map { stack =>
      val destination = Destination(stack.id, stack.displayName, stack.stage, stack.stack,
          stack.composerPrefix, stack.isSecondary, None, None, available = false)

      flexibleApi.changeDetails(stack, contentId).map { cdOption =>
        destination.withApiStatus(cdOption, available = true)
      } recover {
        // if we fail to talk to the stack's API for any reason then provide a destination with available set to false
        case NonFatal(e) =>
          logger.warn(s"Couldn't communicate with Flexible stack at ${stack.apiPrefix}", e)
          destination
      }
    }
    Future.sequence(destinations).map(d => Ok(Json.toJson(d)))
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
