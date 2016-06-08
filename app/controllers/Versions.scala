package controllers

import config.RestorerConfig
import helpers.Loggable
import play.api.libs.json._
import play.api.libs.ws.WSClient
import play.api.mvc._
import s3.S3

case class Version(timestamp: String, snapshot: JsValue)
object Version { implicit val jsonFormats = Json.format[Version] }

case class VersionCount(id: String, versionCount: Int)
object VersionCount { implicit val jsonFormats = Json.format[VersionCount] }


class Versions(val config: RestorerConfig, s3Helper: S3, override val wsClient: WSClient)
  extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(contentId: String, versionId: String) = AuthAction {
    val versionPath = versionId
    val snapshot = s3Helper.getSnapshot(versionPath)
    Ok(snapshot).as(JSON)
  }

  def versions(contentId: String) = AuthAction {
    logger.info(s"Getting JSON versions for $contentId")
    val snapshots = s3Helper.listForId(contentId)
    val versions = snapshots.map{ s =>
      Version(s.timestamp, Json.parse(s3Helper.getSnapshot(s.key)))
    }
    Ok(Json.toJson(versions))
  }

  def availableVersionsCount(contentId: String) = AuthAction {
    val count = VersionCount(contentId, s3Helper.listForId(contentId).size)
    Ok(Json.toJson(count))
  }
}
