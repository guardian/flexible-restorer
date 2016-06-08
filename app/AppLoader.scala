import play.api.ApplicationLoader.Context
import play.api.{Application, ApplicationLoader}

class AppLoader extends ApplicationLoader {
  def load(context: Context): Application = {
    new AppComponents(context).application
  }
}
