package models

case class SnapshotId(contentId: String, timestamp: String) {
  lazy val key = s"$contentId/$timestamp.json"
  override def toString = key
}
object SnapshotId {
  private val SnapshotRegEx = """([0-9a-f]{24})/(.*).json""".r

  def fromKey: String => Option[SnapshotId] = {
    case SnapshotRegEx(contentId, timestamp) => Some(SnapshotId(contentId, timestamp))
    case _ => None
  }
}
