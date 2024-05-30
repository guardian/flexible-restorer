package controllers

import auth.PanDomainAuthActions
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.gu.permissions.PermissionsProvider
import config.{AWS, AppConfig}
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext

class Management(
  val controllerComponents: ControllerComponents,
  val config:AppConfig,
  override val wsClient: WSClient,
  override val permissions: PermissionsProvider,
  override val panDomainSettings: PanDomainAuthSettingsRefresher
) extends BaseController with PanDomainAuthActions {

  def healthCheck = Action {
    Ok("Ok")
  }

  def info = AuthAction {
    val info =
      s"""
      |Hostname: ${config.hostName}
      |Composer domains: ${config.allStacks.map(_.composerPrefix).mkString(", ")}
      |Snapshots buckets: ${config.sourceStacks.map(_.snapshotBucket).mkString(", ")}
      """.stripMargin

    Ok(info)
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
