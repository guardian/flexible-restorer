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
      |Templates Bucket: ${RestorerConfig.templatesBucket}
      |Snapshots draft bucket: ${RestorerConfig.draftBucket}
      |Snapshots live bucket: ${RestorerConfig.liveBucket}
      |Credentials: ${RestorerConfig.creds}
      """.stripMargin

    Ok(info)
  }
}
