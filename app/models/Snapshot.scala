package models

import play.api.libs.json.JsValue

case class Snapshot(id: SnapshotId, data: JsValue)
