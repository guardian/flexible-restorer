import java.io.File
import java.util.{Map => JMap}

import com.amazonaws.services.lambda.runtime.{Context => λContext}
import play.api.ApplicationLoader.Context
import play.api.mvc.{AnyContentAsEmpty, RequestHeader}
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

import scala.collection.JavaConverters._

class LambdaEntrypoint extends Writeables {

  println("We started and ran!")
  val appLoader = new AppLoader()
  println("We newed up an app loader")
  val environment = new Environment(new File("/"), getClass.getClassLoader, Mode.Prod)
  val configuration = Configuration.load(environment)
  val appContext = new Context(
    environment,
    None,
    new DefaultWebCommands(),
    configuration
  )
  val app = appLoader.load(appContext)
  println("Now I have an application!")

  Play.start(app)
  println("Play application started")

  def run(event: JMap[String, Object], context: λContext): Unit = {
    val request = Request.fromEvent(event.asScala.toMap)

    // actually call the router
    val maybeResult = Helpers.route(app, request)(Helpers.writeableOf_AnyContentAsEmpty)
    context.getLogger.log(maybeResult.fold(s"Route not found for $request")(_ => s"Successfully routed $request"))

    import Helpers.defaultAwaitTimeout

    maybeResult.map(Helpers.contentAsString).foreach{result =>
      context.getLogger.log(result)
    }

    context.getLogger.log("Finished")
  }
}

object Request {
  def fromEvent(event: Map[String, Object]): FakeRequest[AnyContentAsEmpty.type] = {
    val method = event("method").asInstanceOf[String]
    val uri = event("uri").asInstanceOf[String]
    FakeRequest(
      method = method,
      uri = uri,
      headers = FakeHeaders(),
      body = AnyContentAsEmpty
    )
  }
}
