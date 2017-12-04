package models

import org.joda.time.DateTime
import play.api.libs.json._

case class ChangeDetails(revisionId: Long, lastModified: DateTime)
object ChangeDetails {
  implicit val dateTimeWrites: Writes[DateTime] = JodaWrites.jodaDateWrites("yyyy-MM-dd'T'HH:mm:ssZ")
  implicit val dateTimeReads: Reads[DateTime] = JodaReads.jodaDateReads("yyyy-MM-dd'T'HH:mm:ssZ")
  implicit val format: OFormat[ChangeDetails] = Json.format[ChangeDetails]
}
