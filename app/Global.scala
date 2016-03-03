import config.RestorerConfig
import helpers.LogStash
import play.api.{Mode, Application, GlobalSettings}

object Global extends GlobalSettings {
  override def beforeStart(app: Application) = {
    // start up logging when in production
    if (app.mode == Mode.Prod) RestorerConfig.loggingConfig.foreach(LogStash.init)
  }
}
