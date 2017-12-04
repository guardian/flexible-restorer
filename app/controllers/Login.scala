package controllers

import config.RestorerConfig
import helpers.Loggable
import permissions.Permissions
import play.api.libs.json.Json
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContext, Future}

class Login(val controllerComponents: ControllerComponents, permissionsClient: Permissions, val config: RestorerConfig, override val wsClient: WSClient)
  extends BaseController with PanDomainAuthActions with Loggable {

  def oauthCallback = Action.async { implicit request =>
    processGoogleCallback()
  }

  def logout = Action.async { implicit request =>
    Future(processLogout)
  }

  def authError(message: String) = Action.async { implicit request =>
    Future(Forbidden(views.html.authError(message)))
  }

  def user() = AuthAction { implicit request =>
    Ok(request.user.toJson).as(JSON)
  }

  def permissions() = AuthAction.async { implicit request =>
    val permissionsMap = permissionsClient.userPermissionMap(request.user)
    permissionsMap.map{ permissions =>
      val nameMap = permissions.map{case (p, v) => p.name -> v}
      Ok(Json.toJson(nameMap))
    }
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
