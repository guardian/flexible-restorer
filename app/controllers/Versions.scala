package controllers

import org.joda.time.DateTime
import play.api.mvc._
import play.api.libs.json._
import helpers.Loggable

import s3.S3

case class Snapshot(key: String) {
  lazy val savedAt: DateTime = new DateTime(key.split("/").last)
}

object Versions extends Controller with PanDomainAuthActions with Loggable {
  // List versions
  def index(contentId: String) = AuthAction {
    val s3 = new S3
    val draftVersionKeys = s3.listDraftForId(contentId)

    val draftVersions = draftVersionKeys.map(Snapshot)

    if (draftVersions != Nil) {
      // We use the last snapshot's headline.
      val snapshot = draftVersions.lastOption
      val headline = snapshot.flatMap { ss =>
        (Json.parse(s3.getDraftSnapshot(ss.key)) \ "preview" \ "fields" \ "headline").asOpt[String]
      }

      Ok(views.html.Versions.index(contentId, draftVersions, headline getOrElse ""))
    } else {
      Ok(views.html.Versions.index(contentId, draftVersions, ""))
    }

  }

  // Show a specific version
  def show(contentId: String, isLive: Boolean, versionId: String) = AuthAction {
    val s3 = new S3
    val versionPath = versionId

    val snapshot = if (isLive) s3.getLiveSnapshot(versionPath) else s3.getDraftSnapshot(versionPath)

    Ok(snapshot).as(JSON)
  }

  def showReadable(contentId: String, isLive: Boolean, versionId: String) = AuthAction {
    val showActionPath = routes.Versions.show(contentId, isLive, versionId).url
    Ok(views.html.Versions.show(contentId, versionId, showActionPath))

  }

  def getJSONVersionsCollection(contentId: String) = AuthAction {
    logger.info(s"Getting JSON versions for $contentId")
    val timestamp: String => Option[String] = _.split("/").lift(7)
    val s3                    = new S3
    val draftVersionKeys      = s3.listDraftForId(contentId)
    val draftVersions         = draftVersionKeys.map(Snapshot)
    val both = (draftVersionKeys, draftVersions).zipped
    val draftVersionsContent  = Json.toJson(both.map {(key, ss) =>
      Map(timestamp(key).get -> Json.parse(s3.getDraftSnapshot(ss.key)))
    })

    Ok(draftVersionsContent)
  }


  case class VersionCount(id: String, versionCount: Int)
  object VersionCount { implicit val jsonFormats = Json.format[VersionCount]}
  def availableVersionsCount(contentId: String) = SharedSecretAuthAction {
    val s3 = new S3
    val count = VersionCount(contentId, s3.listDraftForId(contentId).size)
    Ok(Json.toJson(count))
  }

}
