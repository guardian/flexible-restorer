import com.gu.conf.{ConfigurationLoader, SSMConfigurationLocation}
import com.gu.{AppIdentity, AwsIdentity, DevIdentity}
import config.AWS._
import play.api.ApplicationLoader.Context
import play.api._

class AppLoader extends ApplicationLoader {
  def load(context: Context): Application = {
    startLogging(context)

    val identity: AppIdentity = AppIdentity.whoAmI(defaultAppName, credentials).getOrElse(DevIdentity(defaultAppName))
    val loadedConfig = ConfigurationLoader.load(identity, credentials) {
      // we use `defaultAppName` here instead of `aws.app` because the app name has diverged in EC2 tags and SSM
      case aws:AwsIdentity => SSMConfigurationLocation(s"/${aws.stack}/$defaultAppName/${aws.stage}", aws.region)
      case _: DevIdentity => SSMConfigurationLocation(s"/$defaultStack/$defaultAppName/DEV", defaultRegion.id())
    }

    new AppComponents(context.copy(initialConfiguration = context.initialConfiguration.withFallback(Configuration(loadedConfig))), identity).application
  }

  private def startLogging(context: Context): Unit = {
    LoggerConfigurator(context.environment.classLoader).foreach {
      _.configure(context.environment)
    }
  }
}
