package controllers

import config.RestorerConfig
import helpers.Loggable
import permissions.Permissions
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

class Login(permissionsClient: Permissions, val config: RestorerConfig, override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {

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

  def permissions() = AuthAction { implicit request =>
    val permissions = s"""{\"restoreContent\" : ${permissionsClient.hasAccess(request.user)}}"""
    Ok(permissions).as(JSON)
  }

}
