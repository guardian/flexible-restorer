package controllers

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.{AWS, RestorerConfig}
import play.api.libs.ws.WSClient
import play.api.mvc._

import scala.concurrent.ExecutionContext

class Management(val controllerComponents: ControllerComponents, val config:RestorerConfig, override val wsClient: WSClient, val panDomainSettings: PanDomainAuthSettingsRefresher) extends BaseController with PanDomainAuthActions {

  def healthCheck = Action {
    Ok("Ok")
  }

  def info = AuthAction {
    val info =
      s"""
      |Hostname: ${config.hostName}
      |Composer domains: ${config.allStacks.map(_.composerPrefix).mkString(", ")}
      |Snapshots buckets: ${config.sourceStacks.map(_.snapshotBucket).mkString(", ")}
      |Credentials: ${AWS.creds}
      """.stripMargin

    Ok(info)
  }

  protected val parser: BodyParser[AnyContent] = controllerComponents.parsers.default
  protected val executionContext: ExecutionContext = controllerComponents.executionContext
}
