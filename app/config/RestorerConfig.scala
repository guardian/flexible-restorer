package config

import _root_.aws.AwsInstanceTags
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, InstanceProfileCredentialsProvider}
import helpers.KinesisAppenderConfig
import models.FlexibleStack
import play.api.Configuration

class RestorerConfig(config: Configuration) extends AwsInstanceTags {

  lazy val stage = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }
  lazy val effectiveStage = readTag("Stage") match {
    case Some(value) => value
    case None => "CODE" // use CODE when in development mode
  }

  val domain = RestorerConfig.domainFromStage(stage)
  val effectiveDomain = RestorerConfig.domainFromStage(effectiveStage)

  val stackName = readTag("Stack").getOrElse("flexible")

  val localStack: Option[FlexibleStack] = if (readTag("Stage").isEmpty)
    Some(FlexibleStack(
      "DEV:flexible",
      "Local Flexible Content",
      "flexible",
      "DEV",
      false,
      "http://localhost:9082/api",
      "https://composer.local.dev-gutools.co.uk",
      "not-applicable"))
  else None

  val allStacks = List(
    FlexibleStack(stackName, effectiveStage),
    FlexibleStack(s"$stackName-secondary", effectiveStage)
  ) ++ localStack

  val sourceStacks = allStacks.filter(_.stage == effectiveStage)

  val stacksById = allStacks.map(s => s.id -> s).toMap
  val stackFromId = stacksById.apply _

  val hostName: String = "https://restorer." + domain

  val validPreProductionEnvironments = Seq("code", "local")

  val corsableDomains = allStacks.map(_.composerPrefix)

  val profile: String = config.getString("profile").getOrElse("composer")
  val creds = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider(profile),
    new InstanceProfileCredentialsProvider
  )

  // Logging
  lazy val loggingConfig = for {
    stream <- config.getString("logging.stream")
  } yield KinesisAppenderConfig(stream, new DefaultAWSCredentialsProviderChain())
}

object RestorerConfig {
  def domainFromStage(stage: String): String = {
    stage match {
      case "PROD" => "gutools.co.uk"
      case "DEV" => "local.dev-gutools.co.uk"
      case x => x.toLowerCase() + ".dev-gutools.co.uk"
    }
  }
}
