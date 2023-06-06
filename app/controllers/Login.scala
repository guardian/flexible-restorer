package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.AppConfig
import helpers.Loggable
import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContext, Future}

class Login(val controllerComponents: ControllerComponents, permissionsClient: PermissionsProvider, val config: AppConfig, override val wsClient: WSClient, val panDomainSettings: PanDomainAuthSettingsRefresher)
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

  def user(): Action[AnyContent] = AuthAction { implicit request =>
    Ok(request.user.toJson).as(JSON)
  }

  def permissions(): Action[AnyContent] = AuthAction.async { implicit request =>
    val permissionsMap = permissionsClient.listPermissions(request.user.email)
    permissionsMap.map{ permissions =>
      val nameMap = permissionsMap.map { case (p, v) => p.name -> v }
      Future.successful(Ok(Json.toJson(nameMap)))
    }
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
