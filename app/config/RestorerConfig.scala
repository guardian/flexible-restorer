package config

import _root_.aws.AwsInstanceTags
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, InstanceProfileCredentialsProvider}
import helpers.KinesisAppenderConfig
import models.FlexibleStack
import play.api.Configuration

class RestorerConfig(config: Configuration) extends AwsInstanceTags {

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }
  private lazy val effectiveStage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "CODE" // use CODE when in development mode
  }

  val domain: String = RestorerConfig.domainFromStage(stage)

  private val stackName = "flexible"

  private val localStack: Option[FlexibleStack] = if (readTag("Stage").isEmpty)
    Some(FlexibleStack(
      id = "DEV:flexible",
      displayName = "Local Flexible Content",
      stack = "flexible",
      stage = "DEV",
      isSecondary = false,
      apiPrefix = "http://localhost:9082/api",
      composerPrefix = "https://composer.local.dev-gutools.co.uk",
      snapshotBucket = "not-applicable"))
  else None

  private val destinationStages: List[String] = effectiveStage match {
    case "PROD" => List("PROD", "CODE")
    case "CODE" => List("CODE")
  }

  val allStacks: List[FlexibleStack] = destinationStages.flatMap { thisStage =>
    List(
      FlexibleStack(stackName, thisStage),
      FlexibleStack(s"$stackName-secondary", thisStage)
    )
  } ++ localStack

  val sourceStacks: List[FlexibleStack] = allStacks.filter(_.stage == effectiveStage)

  private val stacksById: Map[String, FlexibleStack] = allStacks.map(s => s.id -> s).toMap
  val stackFromId: (String) => FlexibleStack = stacksById.apply

  val hostName: String = "https://restorer." + domain

  val corsableDomains: List[String] = allStacks.map(_.composerPrefix)

  private val profile: String = config.getOptional[String]("profile").getOrElse("composer")
  val creds = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider(profile),
    new InstanceProfileCredentialsProvider
  )

  // Logging
  lazy val loggingConfig: Option[KinesisAppenderConfig] = for {
    stream <- config.getOptional[String]("logging.stream")
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
