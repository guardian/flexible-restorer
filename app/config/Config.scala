package config

import com.amazonaws.services.simplesystemsmanagement.AWSSimpleSystemsManagement
import com.gu.configraun.aws.AWSSimpleSystemsManagementFactory
import com.gu.configraun.{Configraun, models}
import com.gu.configraun.models.{App, Identifier, Stack, Stage}
import com.typesafe.config.{Config => TypesafeConfig}
import com.typesafe.config.ConfigValueFactory.fromAnyRef
import config.AWS._
import play.api.ApplicationLoader.Context
import play.api.Logging

object Config extends Logging {
  implicit val client: AWSSimpleSystemsManagement = AWSSimpleSystemsManagementFactory(region.getName, profile)
  private lazy val SSMConfig: models.Configuration = Configraun.loadConfig(Identifier(Stack(stackName), App(app), Stage.fromString(stage).get)) match {
    case Left(a) =>
      logger.error(s"Unable to load Configraun configuration from AWS (${a.message})")
      sys.exit(1)
    case Right(a) =>
      logger.info(s"Loaded config using Configraun for /$stackName/$app/$stage")
      a
  }

  def buildConfig(context: Context): TypesafeConfig = context.initialConfiguration.underlying
    .withValue("play.http.secret.key", fromAnyRef(readSSMParameter("play.http.secret.key")))
    .withValue("logging.stream", fromAnyRef(readSSMParameter("logging.stream")))

  private def readSSMParameter(str: String): String = SSMConfig.getAsString(s"/$str") match {
    case Left(e) =>
      logger.warn(s"Unable to load find '$str' in the config \n${e.message}")
      ""
    case Right(a) => a
  }
}
