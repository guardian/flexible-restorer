package models

import org.joda.time.DateTime
import play.api.libs.json.{JsValue, Json, Writes}

case class ChangeDetails(revisionId: Long, lastModified: DateTime)
object ChangeDetails {
  implicit val dateTimeWrites = Writes.jodaDateWrites("yyyy-MM-dd'T'HH:mm:ssZ")
  implicit val format = Json.format[ChangeDetails]
}
