package models

import play.api.libs.json.Json

case class Destination(
  systemId: String,
  displayName: String,
  stage: String,
  stack: String,
  composerPrefix: String,
  isSecondary: Boolean,
  revision: Option[Long],
  available: Boolean
)

object Destination {
  implicit val formats = Json.format[Destination]
}
