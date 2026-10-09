package controllers

import auth.PanDomainAuthActions
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import helpers.Loggable
import play.api.data.Forms._
import play.api.data._
import play.api.libs.ws.WSClient
import play.api.mvc._
import play.api.libs.json.Json

import scala.concurrent.ExecutionContext

// Pan domain
import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import config.AppConfig
import helpers.CORSable




class Application(
  val controllerComponents: ControllerComponents,
  val config:AppConfig,
  override val wsClient: WSClient,
  override val permissions: PermissionsProvider,
  val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions with Loggable {

  val urlForm = Form(
    "url" -> nonEmptyText
  )

  val clientConfig: String = Json.obj(
    "gaId" -> config.googleTrackingId
  ).toString()

  private def withFeatureDefaults(result: Result, secure: Boolean): Result = {
    val defaults = Json.obj("compactSnapshotList" -> false).toString()
    result.withCookies(Cookie(
      "restorer-feature-defaults",
      java.net.URLEncoder.encode(defaults, java.nio.charset.StandardCharsets.UTF_8),
      secure = secure,
      httpOnly = false,
      sameSite = Some(Cookie.SameSite.Lax)
    ))
  }

  def index = AuthAction { (request: com.gu.pandomainauth.action.UserRequest[AnyContent]) =>
    withFeatureDefaults(Ok(views.html.main("Composer Restorer", clientConfig, config.googleTrackingId)), request.secure)
  }

  def versionIndex(contentId: String) = AuthAction { (request: com.gu.pandomainauth.action.UserRequest[AnyContent]) =>
    withFeatureDefaults(Ok(views.html.main(s"Composer Restorer - Versions of $contentId", clientConfig, config.googleTrackingId)), request.secure)
  }

  def preflight(routes: String) = CORSable(executionContext, config.corsableDomains*) {
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
