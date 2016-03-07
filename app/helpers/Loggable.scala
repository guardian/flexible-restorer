package helpers

import org.slf4j.LoggerFactory

trait Loggable {
  val logger = LoggerFactory.getLogger(getClass)
}
