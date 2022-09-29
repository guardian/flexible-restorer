package config

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.AWS._
import helpers.KinesisAppenderConfig
import models.FlexibleStack
import com.typesafe.config.{Config => TypesafeConfig}

class RestorerConfig(config: TypesafeConfig) {

  val domain: String = RestorerConfig.domainFromStage(stage)

  private val localStack: Option[FlexibleStack] = if (stage == "DEV")
    Some(FlexibleStack(
      id = "DEV:flexible",
      displayName = "Local Flexible Content",
      stack = "flexible",
      stage = "DEV",
      isSecondary = false,
      apiPrefix = "http://localhost:9085/api",
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

  // Logging
  lazy val loggingConfig = KinesisAppenderConfig(config.getString("logging.stream"))

  // GA
  lazy val googleTrackingId: String = config.getString("google.tracking.id")

  val panDomainSettings: PanDomainAuthSettingsRefresher = new PanDomainAuthSettingsRefresher(
    domain,
    system = "restorer",
    bucketName = "pan-domain-auth-settings",
    settingsFileKey = s"$domain.settings",
    s3Client = S3ClientV1
  )
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
