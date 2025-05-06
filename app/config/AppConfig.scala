package config

import com.gu.{AppIdentity, AwsIdentity, DevIdentity}
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.AWS._
import models.FlexibleStack
import play.api.Configuration

class AppConfig(configuration: Configuration, identity: AppIdentity) {
  private val underlyingConfig = configuration.underlying

  val (app, stack, stage, region) = identity match {
    case aws:AwsIdentity => (aws.app, aws.stack, aws.stage, aws.region)
    case _:DevIdentity => (defaultAppName, defaultStack, "DEV", defaultRegion.id())
  }

  lazy val effectiveStage: String = stage match {
    case "DEV" => "CODE" // use CODE when in development mode
    case value => value
  }

  val domain: String = AppConfig.domainFromStage(stage)

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
      FlexibleStack(stack, thisStage),
      FlexibleStack(s"$stack-secondary", thisStage)
    )
  } ++ localStack

  val sourceStacks: List[FlexibleStack] = allStacks.filter(_.stage == effectiveStage)

  private val stacksById: Map[String, FlexibleStack] = allStacks.map(s => s.id -> s).toMap
  val stackFromId: (String) => FlexibleStack = stacksById.apply

  val hostName: String = "https://restorer." + domain

  val corsableDomains: List[String] = allStacks.map(_.composerPrefix)

  // Logging
  val kinesisLoggingStream: String = underlyingConfig.getString("logging.stream")
  val kinesisLoggingBufferSize: Int = 1000

  // GA
  lazy val googleTrackingId: String = underlyingConfig.getString("google.tracking.id")

  val trackingPixel: Option[TrackingPixel] = (stage match {
    case "PROD" => Some(TelemetryPROD)
    case "CODE" => Some(TelemetryCODE)
    case "DEV" => Some(TelemetryDEV)
    case _ => None
  }).map(TrackingPixel(_))

}

object AppConfig {
  def domainFromStage(stage: String): String = {
    stage match {
      case "PROD" => "gutools.co.uk"
      case "DEV" => "local.dev-gutools.co.uk"
      case x => x.toLowerCase() + ".dev-gutools.co.uk"
    }
  }
}
