package config

import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, InstanceProfileCredentialsProvider}
import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement
import com.gu.configraun.aws.AWSSimpleSystemsManagementFactory
import com.gu.configraun.models._
import models.FlexibleStack
import com.gu.configraun.{Configraun, Errors, models}
import helpers.KinesisAppenderConfig
import play.api.Logger

class RestorerConfig(config: Configuration) extends AwsInstanceTags {

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }
  private lazy val effectiveStage: String = stage match {
    case "DEV" => "CODE" // use CODE when in development mode
    case value => value
  }

  val domain: String = RestorerConfig.domainFromStage(stage)

  private val stackName = "flexible"

  private val localStack: Option[FlexibleStack] = if (stage == "DEV")
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

  private val profile: String = "composer"
  val creds = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider(profile),
    InstanceProfileCredentialsProvider.getInstance()
  )

  implicit val client: AWSSimpleSystemsManagement = AWSSimpleSystemsManagementFactory(AWS.region.getName, profile)
  private lazy val configraunConfig: models.Configuration = Configraun.loadConfig(Identifier(Stack(stackName), App("restorer"), Stage.fromString(effectiveStage).get)) match {
    case Left(a) =>
      Logger.error(s"Unable to load Configraun configuration from AWS (${a.message})")
      sys.exit(1)
    case Right(a) =>
      Logger.info(s"Loaded config using Configraun for /$stackName/restorer/$effectiveStage")
      a
  }

  // Logging
  lazy val loggingConfig: Either[Errors.ConfigraunError, KinesisAppenderConfig] = for {
    stream <- configraunConfig.getAsString("/logging.stream")
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
