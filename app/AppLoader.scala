import config.Config
import play.api.ApplicationLoader.Context
import play.api._

class AppLoader extends ApplicationLoader {
  def load(contextBefore: Context): Application = {

    val config = Config.buildConfig(contextBefore)

    val contextAfter = contextBefore.copy(initialConfiguration = Configuration(config))

    startLogging(contextAfter)
    new AppComponents(contextAfter, config).application
  }

  private def startLogging(context: Context): Unit = {
    LoggerConfigurator(context.environment.classLoader).foreach {
      _.configure(context.environment)
    }
  }
}
