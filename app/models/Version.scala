package models

import play.api.libs.json.{JsValue, Json, Format}

case class Version(timestamp: String, snapshot: JsValue)
object Version { implicit val jsonFormats: Format[Version] = Json.format[Version] }
