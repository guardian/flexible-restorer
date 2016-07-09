import java.io.File
import java.util.{Map => JMap}

import com.amazonaws.services.lambda.runtime.{Context => λContext}
import com.typesafe.config.ConfigFactory
import play.api.ApplicationLoader.Context
import play.api.test.{FakeRequest, Helpers}
import play.api.{Configuration, Environment, Mode}
import play.core.DefaultWebCommands

class LambdaEntrypoint {
  def run(event: JMap[String, Object], context: λContext): Unit = {
    context.getLogger.log("We started and ran!")
    val appLoader = new AppLoader()
    context.getLogger.log("We newed up an app loader")
    val appContext = new Context(
      new Environment(new File("/"), getClass.getClassLoader, Mode.Prod),
      None,
      new DefaultWebCommands(),
      new Configuration(ConfigFactory.empty)
    )
    val app = appLoader.load(appContext)
    context.getLogger.log("Now I have an application!")
    val fakeRequest = FakeRequest("GET", "/management/healthcheck")

    // actually call the router
    val maybeResult = Helpers.route(app, fakeRequest)

    maybeResult.map(Helpers.contentAsString).foreach{result =>
      context.getLogger.log(result)
    }
  }
}
