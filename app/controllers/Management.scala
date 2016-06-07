package controllers

import play.api.mvc._
import scala.concurrent.ExecutionContext.Implicits.global
import config.RestorerConfig

class Management extends Controller with PanDomainAuthActions {

  def healthCheck = Action {
    Ok("Ok")
  }

  def info = AuthAction {
    val info =
      s"""
      |Hostname: ${RestorerConfig.hostName}
      |Composer Domain: ${RestorerConfig.composerDomain}
      |Snapshots bucket: ${RestorerConfig.snapshotBucket}
      |Credentials: ${RestorerConfig.creds}
      """.stripMargin

    Ok(info)
  }
}
