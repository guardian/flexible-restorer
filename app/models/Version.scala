package models

import play.api.libs.json.{JsValue, Json}

case class Version(timestamp: String, snapshot: JsValue)
object Version { implicit val jsonFormats = Json.format[Version] }
