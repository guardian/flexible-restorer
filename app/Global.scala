import config.RestorerConfig
import helpers.{Loggable, LogStash}
import permissions.Permissions
import play.api.{Mode, Application, GlobalSettings}

object Global extends GlobalSettings with Loggable {
  override def beforeStart(app: Application) = {
    // start up logging when in production
    if (app.mode == Mode.Prod) RestorerConfig.loggingConfig.foreach(LogStash.init)
    // this is horribly side-effecty - we retrieve the permissions config to start the permissions client
    // doesn't seem to be a nicer way to do it in the library.
    val permissionsConfig = Permissions.config
    logger.info(s"Permissions object initialised with config: $permissionsConfig")
  }
}
