package com.gu.restorer.helpers

import org.slf4j.LoggerFactory


trait Loggable {

  private lazy val internalLogger = LoggerFactory.getLogger(getClass)

  def info(message: String) = {
    internalLogger.info(message)
  }

  def error(message: String) = {
    internalLogger.error(message)
  }
}
