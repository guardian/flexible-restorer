package models

import play.api.libs.json.Json

case class VersionCount(id: String, versionCount: Int)
object VersionCount { implicit val jsonFormats = Json.format[VersionCount] }
