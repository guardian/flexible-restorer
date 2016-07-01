package models

import org.joda.time.DateTime
import play.api.libs.json.Json

case class Destination(
  systemId: String,
  displayName: String,
  stage: String,
  stack: String,
  composerPrefix: String,
  isSecondary: Boolean,
  changeDetails: Option[ChangeDetails],
  lastModified: Option[DateTime],
  available: Boolean
) {
  def withApiStatus(changeDetails: Option[ChangeDetails], available: Boolean): Destination =
    this.copy(changeDetails = changeDetails, available = available)
}

object Destination {
  implicit val formats = Json.format[Destination]
}
