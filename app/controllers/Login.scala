package controllers

import auth.PanDomainAuthActions
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import config.AppConfig
import helpers.Loggable
import permissions.Permissions
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContext, Future}

class Login(
  val controllerComponents: ControllerComponents,
  val config: AppConfig,
  override val wsClient: WSClient,
  override val permissions: PermissionsProvider,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
)
  extends BaseController with PanDomainAuthActions with Loggable {

  def oauthCallback: Action[AnyContent] = Action.async { implicit request =>
    processOAuthCallback()
  }

  def logout: Action[AnyContent] = Action.async { implicit request =>
    Future(processLogout)
  }

  def authError(message: String): Action[AnyContent] = Action.async { implicit request =>
    Future(Forbidden(views.html.authError(message)))
  }

  def user: Action[AnyContent] = AuthAction { implicit request =>
    Ok(request.user.toJson).as(JSON)
  }

  def usersPermissions: Action[AnyContent] = AuthAction { implicit request =>
    Ok(Json.toJson(
      Permissions.all.view.map(
        p => p.name -> permissions.hasPermission(p, request.user.email)
      ).toMap
    ))
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
