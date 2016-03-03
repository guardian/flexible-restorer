package controllers

import play.api.mvc._
import scala.concurrent.Future
import helpers.Loggable
import scala.concurrent.ExecutionContext.Implicits.global

object Login extends Controller with PanDomainAuthActions with Loggable {

  def oauthCallback = Action.async { implicit request =>
    processGoogleCallback()
  }

  def logout = Action.async { implicit request =>
    Future(processLogout)
  }

  def authError(message: String) = Action.async { implicit request =>
    Future(Forbidden(views.html.Login.authError(message)))
  }

  def user() = AuthAction { implicit request =>
    Ok(request.user.toJson).as(JSON)
  }

}
