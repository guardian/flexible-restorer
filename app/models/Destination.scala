package models

import org.joda.time.DateTime
import play.api.libs.json._

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
  implicit val dateTimeWrites: Writes[DateTime] = JodaWrites.jodaDateWrites("yyyy-MM-dd'T'HH:mm:ssZ")
  implicit val dateTimeReads: Reads[DateTime] = JodaReads.jodaDateReads("yyyy-MM-dd'T'HH:mm:ssZ")
  implicit val formats: OFormat[Destination] = Json.format[Destination]
}
