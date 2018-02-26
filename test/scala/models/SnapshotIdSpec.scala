package scala.models

import models.SnapshotId
import org.scalatest.{FlatSpec, Matchers}
import Matchers._

class SnapshotIdSpec extends FlatSpec {
  "fromKey" should "extract the ID and timestamp from a key" in {
    val key = "575ee43ee4b0625eba5110f6/2016-06-13T16:57:50.306Z.json"
    SnapshotId.fromKey(key) should be(Some(SnapshotId("575ee43ee4b0625eba5110f6", "2016-06-13T16:57:50.306Z")))
  }

  it should "extract the ID and timestamp from an info key" in {
    val key = "575ee43ee4b0625eba5110f6/2016-06-13T16:57:50.306Z.info.json"
    SnapshotId.fromKey(key) should be(Some(SnapshotId("575ee43ee4b0625eba5110f6", "2016-06-13T16:57:50.306Z")))
  }
}
