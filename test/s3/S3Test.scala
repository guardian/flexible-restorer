package s3

import org.scalatest.{FreeSpec, Matchers}

class S3Test extends FreeSpec with Matchers {
  "idToKey" - {
    "should generate a correct key from an ID" in {
      S3.idToKey("56c606d5f7d0eac3f1f21b6a") shouldEqual "5/6/c/6/0/6/56c606d5f7d0eac3f1f21b6a"
    }
  }
}
