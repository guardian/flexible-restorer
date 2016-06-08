package config

import _root_.aws.AwsInstanceTags
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, InstanceProfileCredentialsProvider}
import helpers.KinesisAppenderConfig
import play.api.Configuration

class RestorerConfig(config: Configuration) extends AwsInstanceTags {

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }

  lazy val defaultBucketStage = if (stage == "DEV") "CODE" else stage

  lazy val bucketStage = config.getString("bucketStageOverride").getOrElse(defaultBucketStage)

  val snapshotBucket: String = "flexible-snapshotter-" + bucketStage.toLowerCase()

  val domain: String = stage match {
    case "PROD" => "gutools.co.uk"
    case "DEV" => "local.dev-gutools.co.uk"
    case x => x.toLowerCase() + ".dev-gutools.co.uk"
  }

  val composerDomain: String = "https://composer." + domain

  val hostName: String = "https://restorer." + domain

  val validPreProductionEnvironments = Seq("code", "local")

  val corsableDomains = stage match {
    case "PROD" | "DEV" => Seq(composerDomain)
    case _ => validPreProductionEnvironments.map(x => s"https://composer.$x.dev-gutools.co.uk")
  }

  val profile: String = config.getString("profile").getOrElse("composer")
  val creds = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider(profile),
    new InstanceProfileCredentialsProvider
  )

  // Logging
  lazy val loggingConfig = for {
    stream <- config.getString("logging.stream")
  } yield KinesisAppenderConfig(stream, new DefaultAWSCredentialsProviderChain())

  lazy val apiSharedSecret: String = config.getString("api.sharedsecret") match {
    case Some(x) => x
    case None => throw new RuntimeException(s"No config value for: api.sharedsecret")
  }
}
