package helpers

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.{Logger, LoggerContext}
import ch.qos.logback.core.joran.spi.JoranException
import ch.qos.logback.core.util.StatusPrinter
import com.gu.logback.appender.kinesis.KinesisAppender
import config.{AWS, AppConfig}
import net.logstash.logback.layout.LogstashLayout
import org.slf4j.{LoggerFactory, Logger => SLFLogger}

import scala.util.control.NonFatal

object LogStash extends Loggable {

  // assume SLF4J is bound to logback in the current environment
  lazy val context: LoggerContext = LoggerFactory.getILoggerFactory.asInstanceOf[LoggerContext]

  def makeCustomFields(customFields: Map[String,String]): String = {
    "{" + (for((k, v) <- customFields) yield s""""$k":"$v"""").mkString(",") + "}"
  }

  def makeLayout(customFields: String): LogstashLayout = {
    val l = new LogstashLayout()
    l.setCustomFields(customFields)
    l
  }

  def makeKinesisAppender(layout: LogstashLayout, context: LoggerContext, config: AppConfig): KinesisAppender[ILoggingEvent] = {
    val a = new KinesisAppender[ILoggingEvent]()
    a.setStreamName(config.kinesisLoggingStream)
    a.setRegion(config.region)
    a.setCredentialsProvider(AWS.credentials)
    a.setBufferSize(config.kinesisLoggingBufferSize)

    a.setContext(context)
    a.setLayout(layout)

    layout.start()
    a.start()
    a
  }

  def init(config: AppConfig): Unit = {
    val facts = Map("app" -> config.app, "stack" -> config.stack, "stage" -> config.stage)
    try {
      val layout = makeLayout(makeCustomFields(facts))
      val appender = makeKinesisAppender(layout, context, config)
      val rootLogger = LoggerFactory.getLogger(SLFLogger.ROOT_LOGGER_NAME).asInstanceOf[Logger]
      rootLogger.addAppender(appender)
    } catch {
      case e: JoranException => // ignore, errors will be printed below
      case NonFatal(e) =>
        logger.error("Error whilst initialising LogStash", e)
    }
    StatusPrinter.printInCaseOfErrorsOrWarnings(context)
  }
}
