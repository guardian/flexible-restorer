package config

import _root_.aws.AwsInstanceTags
import com.amazonaws.auth.BasicAWSCredentials
import play.api.Play.current
import play.api._

object RestorerConfig extends AwsInstanceTags {

  // we use the two sets of parameters here so that the secretKey doesn't
  // end up in the case class's toString and other methods
  case class AWSCredentials(accessKey:String)(val secretKey:String) {
    lazy val awsApiCreds = new BasicAWSCredentials(accessKey, secretKey)
  }
  object AWSCredentials {
    def apply(accessKey: Option[String], secretKey: Option[String]): Option[AWSCredentials] = for {
      ak <- accessKey
      sk <- secretKey
    } yield AWSCredentials(ak)(sk)
  }

  lazy val stage: String = readTag("Stage") match {
    case Some(value) => value
    case None => "DEV" // default to dev stage
  }

  val liveBucket: String = "composer-snapshots-live-" + stage.toLowerCase()
  val draftBucket: String = "composer-snapshots-draft-" + stage.toLowerCase()
  val templatesBucket: String = "composer-templates-" + stage.toLowerCase()

  val domain: String = stage match {
    case "PROD" => "gutools.co.uk"
    case "DEV" => "local.dev-gutools.co.uk"
    case x => x.toLowerCase() + ".dev-gutools.co.uk"
  }

  val composerDomain: String = "https://composer." + domain

  val hostName: String = "https://composer-restorer." + domain

  val corsableDomains = RestorerConfig.stage match {
    case "PROD" | "DEV" => Seq(RestorerConfig.composerDomain)
    case _ => Seq("release", "code", "qa").map(x => s"https://composer.$x.dev-gutools.co.uk")
  }

  lazy val config = play.api.Play.configuration

  val accessKey: Option[String] = config.getString("AWS_ACCESS_KEY")
  val secretKey: Option[String] = config.getString("AWS_SECRET_KEY")
  val creds = AWSCredentials(accessKey, secretKey)

  val pandomainKey: Option[String] = config.getString("pandomain.aws.key")
  val pandomainSecret: Option[String] = config.getString("pandomain.aws.secret")
  val pandomainCreds = AWSCredentials(pandomainKey, pandomainSecret)

  // Permissions
  lazy val whitelistMembers: Set[String] = config.getStringSeq("whitelist.members").getOrElse(Nil).toSet

  val usePermissionsService: Boolean = config.getBoolean("permissions.enabled").getOrElse(true)

  lazy val apiSharedSecret: String = config.getString("api.sharedsecret") match {
    case Some(x) => x
    case None => throw new RuntimeException(s"No config value for: api.sharedsecret")
  }
}
