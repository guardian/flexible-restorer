package config

import _root_.aws.AwsInstanceTags
import com.amazonaws.auth.profile.ProfileCredentialsProvider
import com.amazonaws.auth.{InstanceProfileCredentialsProvider, AWSCredentialsProviderChain, DefaultAWSCredentialsProviderChain, BasicAWSCredentials}
import helpers.KinesisAppenderConfig
import play.api.Play.current

object RestorerConfig extends AwsInstanceTags {

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }

  lazy val bucketStage = config.getString("bucketStageOverride").getOrElse(stage)

  val liveBucket: String = "composer-snapshots-live-" + bucketStage.toLowerCase()
  val draftBucket: String = "composer-snapshots-draft-" + bucketStage.toLowerCase()
  val templatesBucket: String = "composer-templates-" + bucketStage.toLowerCase()

  val domain: String = stage match {
    case "PROD" => "gutools.co.uk"
    case "DEV" => "local.dev-gutools.co.uk"
    case x => x.toLowerCase() + ".dev-gutools.co.uk"
  }

  val composerDomain: String = "https://composer." + domain

  val hostName: String = "https://composer-restorer." + domain

  val validPreProductionEnvironments = Seq("release", "code", "qa", "local")

  val corsableDomains = RestorerConfig.stage match {
    case "PROD" | "DEV" => Seq(RestorerConfig.composerDomain)
    case _ => validPreProductionEnvironments.map(x => s"https://composer.$x.dev-gutools.co.uk")
  }

  lazy val config = play.api.Play.configuration

  val profile: String = config.getString("profile").getOrElse("composer")
  val creds = new AWSCredentialsProviderChain(
    new ProfileCredentialsProvider(profile),
    new InstanceProfileCredentialsProvider
  )

  // Permissions
  lazy val whitelistMembers: Set[String] = config.getStringSeq("whitelist.members").getOrElse(Nil).toSet

  val usePermissionsService: Boolean = config.getBoolean("permissions.enabled").getOrElse(true)

  // Logging
  lazy val loggingConfig = for {
    stream <- config.getString("logging.stream")
  } yield KinesisAppenderConfig(stream, new DefaultAWSCredentialsProviderChain())

  lazy val apiSharedSecret: String = config.getString("api.sharedsecret") match {
    case Some(x) => x
    case None => throw new RuntimeException(s"No config value for: api.sharedsecret")
  }
}
