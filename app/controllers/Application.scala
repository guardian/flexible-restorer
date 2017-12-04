package controllers

import helpers.Loggable
import play.api.data.Forms._
import play.api.data._
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext

// Pan domain
import com.amazonaws.auth.AWSCredentialsProvider
import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import config.RestorerConfig
import helpers.CORSable

trait PanDomainAuthActions extends AuthActions {
  def config:RestorerConfig

  override def validateUser(authedUser: AuthenticatedUser): Boolean = authedUser.multiFactor

  override def showUnauthedMessage(message: String)(implicit request: RequestHeader): Result = {
    Results.Redirect(controllers.routes.Login.authError(message))
  }

  override lazy val system: String = "restorer"
  override def authCallbackUrl: String = config.hostName + "/oauthCallback"
  override lazy val domain: String = config.domain

  override def awsCredentialsProvider: AWSCredentialsProvider = config.creds
}


class Application(val controllerComponents: ControllerComponents, val config:RestorerConfig, override val wsClient: WSClient) extends BaseController with PanDomainAuthActions with Loggable {

  val urlForm = Form(
    "url" -> nonEmptyText
  )

  def index = AuthAction {
    Ok(views.html.main("Composer Restorer"))
  }

  def versionIndex(contentId: String) = AuthAction {
    Ok(views.html.main(s"Composer Restorer - Versions of $contentId"))
  }

  def preflight(routes: String) = CORSable(executionContext, config.corsableDomains: _*) {
    Action { implicit req =>
      val requestedHeaders = req.headers.get("Access-Control-Request-Headers")

      NoContent.withHeaders(
        CORSable.CORS_ALLOW_METHODS -> "GET, DELETE, PUT",
        CORSable.CORS_ALLOW_HEADERS -> requestedHeaders.getOrElse(""))
    }
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
