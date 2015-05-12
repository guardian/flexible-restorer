package controllers

import play.Logger
import play.api.mvc._

import scala.concurrent.Future
import com.gu.restorer.helpers.Loggable
import play.api.data._
import play.api.data.Forms._

// Pan domain
import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import helpers.CORSable
import config.RestorerConfig
import com.amazonaws.auth.BasicAWSCredentials

trait PanDomainAuthActions extends AuthActions {
  override def validateUser(authedUser: AuthenticatedUser): Boolean = {
    RestorerConfig.whitelistMembers.contains(authedUser.user.email) && authedUser.multiFactor
  }

  override def showUnauthedMessage(message: String)(implicit request: RequestHeader): Result = {
    Results.Redirect(controllers.routes.Login.authError(message))
  }

  override lazy val system: String = "composer-restorer"
  override def authCallbackUrl: String = RestorerConfig.hostName + "/oauthCallback"
  override lazy val domain: String = RestorerConfig.domain

  override lazy val awsCredentials = RestorerConfig.pandomainCreds.map(_.awsApiCreds)
}


object Application extends Controller with PanDomainAuthActions with Loggable {

  lazy val composer = RestorerConfig.composerDomain

  val urlForm = Form(
    "url" -> nonEmptyText
  )

  def index = AuthAction {
    Ok(views.html.Application.index())
  }

  def find = AuthAction { implicit request =>
    def extractContentId(url: String) = url
      .split('#').head // remove any hash fragment, e.g. referring to live blog posts
      .split("/").last.trim // get the id

    urlForm.bindFromRequest.fold(
      {errorForm => Redirect(controllers.routes.Application.index)},
      {url => Redirect(controllers.routes.Versions.index(extractContentId(url)))}
    )
  }

  def preflight(routes: String) = CORSable(RestorerConfig.corsableDomains: _*) {
    Action { implicit req =>
      val requestedHeaders = req.headers.get("Access-Control-Request-Headers")

      NoContent.withHeaders(
        CORSable.CORS_ALLOW_METHODS -> "GET, DELETE, PUT",
        CORSable.CORS_ALLOW_HEADERS -> requestedHeaders.getOrElse(""))
    }
  }

}
