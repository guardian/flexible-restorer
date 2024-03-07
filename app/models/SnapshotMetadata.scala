package models

import play.api.libs.json.{Json, Format}

case class SnapshotMetadata(reason:String)
object SnapshotMetadata {
  implicit val formats: Format[SnapshotMetadata] = Json.format[SnapshotMetadata]
}
