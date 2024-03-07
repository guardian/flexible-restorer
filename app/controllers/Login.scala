package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.AppConfig
import helpers.Loggable
import permissions.Permissions
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContext, Future}

class Login(val controllerComponents: ControllerComponents, permissionsClient: Permissions, val config: AppConfig, override val wsClient: WSClient, val panDomainSettings: PanDomainAuthSettingsRefresher)
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

  def permissions: Action[AnyContent] = AuthAction.async { implicit request =>
    val permissionsMap = permissionsClient.userPermissionMap(request.user)
    permissionsMap.map{ permissions =>
      val nameMap = permissions.map{case (p, v) => p.name -> v}
      Ok(Json.toJson(nameMap))
    }
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
