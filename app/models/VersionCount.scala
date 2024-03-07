package models

import play.api.libs.json.{Json, Format}

case class VersionCount(id: String, versionCount: Int)
object VersionCount { implicit val jsonFormats: Format[VersionCount] = Json.format[VersionCount] }
