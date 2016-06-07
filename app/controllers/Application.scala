package controllers

import permissions.Permissions
import play.api.mvc._

import helpers.Loggable
import play.api.data._
import play.api.data.Forms._

// Pan domain
import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import helpers.CORSable
import config.RestorerConfig
import com.amazonaws.auth.{DefaultAWSCredentialsProviderChain, AWSCredentialsProvider}

trait PanDomainAuthActions extends AuthActions {

  override def validateUser(authedUser: AuthenticatedUser): Boolean = authedUser.multiFactor

  override def showUnauthedMessage(message: String)(implicit request: RequestHeader): Result = {
    Results.Redirect(controllers.routes.Login.authError(message))
  }

  override lazy val system: String = "restorer"
  override def authCallbackUrl: String = RestorerConfig.hostName + "/oauthCallback"
  override lazy val domain: String = RestorerConfig.domain

  override def awsCredentialsProvider: AWSCredentialsProvider = RestorerConfig.creds
}


class Application extends Controller with PanDomainAuthActions with Loggable {

  lazy val composer = RestorerConfig.composerDomain

  val urlForm = Form(
    "url" -> nonEmptyText
  )

  def index = AuthAction {
    Ok(views.html.main("Composer Restorer", RestorerConfig.composerDomain))
  }

  def versionIndex(contentId: String) = AuthAction {
    Ok(views.html.main(s"Composer Restorer - Versions of $contentId", RestorerConfig.composerDomain))
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
