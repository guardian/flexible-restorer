package models

import play.api.libs.json.{Format, Json}

case class SnapshotId(contentId: String, timestamp: String) {
  lazy val key = s"$contentId/$timestamp.json"
  lazy val infoKey = s"$contentId/$timestamp.info.json"
}

object SnapshotId {
  private val SnapshotRegEx = """([0-9a-f]{24})/(.*?).(info.)?json""".r

  def fromKey: String => Option[SnapshotId] = {
    case SnapshotRegEx(contentId, timestamp, _) => Some(SnapshotId(contentId, timestamp))
    case _ => None
  }

  implicit val formats: Format[SnapshotId] = Json.format[SnapshotId]
}
