package controllers

import config.RestorerConfig
import play.api.libs.ws.WSClient
import play.api.mvc._

class Management(val config:RestorerConfig, override val wsClient: WSClient) extends Controller with PanDomainAuthActions {

  def healthCheck = Action {
    Ok("Ok")
  }

  def info = AuthAction {
    val info =
      s"""
      |Hostname: ${config.hostName}
      |Composer Domains: ${config.allStacks.map(_.composerPrefix).mkString(", ")}
      |Snapshots bucket: ${config.snapshotBucket}
      |Credentials: ${config.creds}
      """.stripMargin

    Ok(info)
  }
}
