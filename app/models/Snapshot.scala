package models

import play.api.libs.json.{JsValue, Json}

case class Snapshot(data: JsValue, metadata: SnapshotMetadata)
object Snapshot {
  implicit val formats = Json.format[Snapshot]
}
