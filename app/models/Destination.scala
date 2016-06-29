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
) {
  def withApiStatus(revision: Option[Long], available: Boolean): Destination =
    this.copy(revision = revision, available = available)
}

object Destination {
  implicit val formats = Json.format[Destination]
}
