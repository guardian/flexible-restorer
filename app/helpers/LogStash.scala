package helpers

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.{Logger, LoggerContext}
import ch.qos.logback.core.joran.spi.JoranException
import ch.qos.logback.core.util.StatusPrinter
import com.amazonaws.auth.AWSCredentialsProvider
import com.amazonaws.regions.Regions
import com.gu.logback.appender.kinesis.KinesisAppender
import config.{AWS, AwsInstanceTags}
import net.logstash.logback.layout.LogstashLayout
import org.slf4j.{LoggerFactory, Logger => SLFLogger}

import scala.language.postfixOps
import scala.util.control.NonFatal

case class KinesisAppenderConfig(
  stream: String,
  credentialsProvider: AWSCredentialsProvider,
  region: Regions = AWS.region,
  bufferSize: Int = 1000
)

object LogStash extends AwsInstanceTags with Loggable {
  lazy val FACTS: Map[String, String] = try {
    val facts: Map[String, String] = {
      logger.info("Loading facts from AWS instance tags")
      Seq("App", "Stack", "Stage").flatMap(tag => readTag(tag).map(tag.toLowerCase ->)).toMap
    }
    logger.info(s"Using facts: $facts")
    facts
  } catch {
    case NonFatal(e) =>
      logger.error("Failed to get facts", e)
      Map.empty
  }
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

  def makeKinesisAppender(layout: LogstashLayout, context: LoggerContext, appenderConfig: KinesisAppenderConfig): KinesisAppender[ILoggingEvent] = {
    val a = new KinesisAppender[ILoggingEvent]()
    a.setStreamName(appenderConfig.stream)
    a.setRegion(appenderConfig.region.getName)
    a.setCredentialsProvider(appenderConfig.credentialsProvider)
    a.setBufferSize(appenderConfig.bufferSize)

    a.setContext(context)
    a.setLayout(layout)

    layout.start()
    a.start()
    a
  }

  def init(config: KinesisAppenderConfig): Unit = {
    try {
      val layout = makeLayout(makeCustomFields(FACTS))
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
