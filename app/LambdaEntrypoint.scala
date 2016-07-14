import java.io.File
import java.util
import java.util.{Map => JMap}

import akka.actor.Cancellable
import akka.stream.{ClosedShape, Graph, Materializer}
import com.amazonaws.services.lambda.runtime.{LambdaLogger, Context => λContext}
import play.api.ApplicationLoader.Context
import play.api.mvc.{AnyContentAsEmpty, RequestHeader}
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.concurrent.duration.FiniteDuration

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
    implicit val logger = context.getLogger
    val request = Request.fromEvent(event.asScala.toMap)

    // actually call the router
    val maybeResult = Helpers.route(app, request)(Helpers.writeableOf_AnyContentAsEmpty)
    context.getLogger.log(maybeResult.fold(s"Route not found for $request")(_ => s"Successfully routed $request"))

    import Helpers.defaultAwaitTimeout

    maybeResult.foreach { of =>
      val result = Await.result(of, Helpers.defaultAwaitTimeout.duration)
      val body = Await.result(result.body.consumeData(NoMaterializer), Helpers.defaultAwaitTimeout.duration)
      context.getLogger.log(s"Result:\n${result.header.status} ${result.header.reasonPhrase}\n$body")
    }

    context.getLogger.log("Finished")
  }
}

object Request {
  def fromEvent(event: Map[String, Object])(implicit logger: LambdaLogger): FakeRequest[AnyContentAsEmpty.type] = {
    val method = event("method").asInstanceOf[String]
    val uri = event("uri").asInstanceOf[String]
    val headers = event.get("headers").map {
      case headerMap: util.LinkedHashMap[_,_] =>
        headerMap.entrySet.asScala.flatMap { entry =>
          (entry.getKey, entry.getValue) match {
            case (key: String, value: String) => Some(key, value)
            case _ => None
          }
        }.toMap
      case _ => Map.empty[String, String]
    }.getOrElse(Map.empty[String, String])

    logger.log(s"Parsed headers $headers")

    FakeRequest(
      method = method,
      uri = uri,
      headers = FakeHeaders(headers.toList),
      body = AnyContentAsEmpty
    )
  }
}

object NoMaterializer extends Materializer {
  def withNamePrefix(name: String) = throw new UnsupportedOperationException("NoMaterializer cannot be named")
  implicit def executionContext = throw new UnsupportedOperationException("NoMaterializer does not have an execution context")
  def materialize[Mat](runnable: Graph[ClosedShape, Mat]) =
    throw new UnsupportedOperationException("No materializer was provided, probably when attempting to extract a response body, but that body is a streamed body and so requires a materializer to extract it.")
  override def scheduleOnce(delay: FiniteDuration, task: Runnable): Cancellable =
    throw new UnsupportedOperationException("NoMaterializer can't schedule tasks")
  override def schedulePeriodically(initialDelay: FiniteDuration, interval: FiniteDuration, task: Runnable): Cancellable =
    throw new UnsupportedOperationException("NoMaterializer can't schedule tasks")
}
