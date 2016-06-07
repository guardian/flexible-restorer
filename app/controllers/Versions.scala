package controllers

import helpers.Loggable
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.mvc._
import s3.S3

case class Snapshot(key: String) {
  lazy val savedAt: DateTime = new DateTime(key.split("/").last)
}

class Versions extends Controller with PanDomainAuthActions with Loggable {
  // Show a specific version
  def show(contentId: String, versionId: String) = AuthAction {
    val s3 = new S3
    val versionPath = versionId
    val snapshot = s3.getSnapshot(versionPath)
    Ok(snapshot).as(JSON)
  }

  def versions(contentId: String) = AuthAction {
    logger.info(s"Getting JSON versions for $contentId")
    val timestamp: String => Option[String] = _.split("/").lift(7)
    val s3                    = new S3
    val versionKeys           = s3.listForId(contentId)
    val versions              = versionKeys.map(Snapshot)
    val both = (versionKeys, versions).zipped
    val versionsContent  = Json.toJson(both.map {(key, ss) =>
      Map(timestamp(key).get -> Json.parse(s3.getSnapshot(ss.key)))
    })

    Ok(versionsContent)
  }


  case class VersionCount(id: String, versionCount: Int)
  object VersionCount { implicit val jsonFormats = Json.format[VersionCount] }
  def availableVersionsCount(contentId: String) = AuthAction {
    val s3 = new S3
    val count = VersionCount(contentId, s3.listForId(contentId).size)
    Ok(Json.toJson(count))
  }

}
