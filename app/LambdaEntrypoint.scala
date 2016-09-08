import java.io.{File, InputStream, OutputStream}
import java.util.{LinkedHashMap => JavaLinkedHashMap}

import akka.actor.Cancellable
import akka.stream.{ClosedShape, Graph, Materializer}
import com.amazonaws.services.lambda.runtime.{LambdaLogger, Context => λContext}
import play.api.ApplicationLoader.Context
import play.api.libs.json.Json
import play.api.mvc.AnyContentAsEmpty
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.concurrent.duration.FiniteDuration

object Loader {
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
}

object Params { implicit val reads = Json.reads[Params] }
case class Params(header: Map[String, String])

object Request {
  implicit val reads = Json.reads[Request]

  // TODO: this should really return an either with better error reporting
  def fromStream(stream: InputStream)(implicit logger: LambdaLogger): Option[FakeRequest[AnyContentAsEmpty.type]] = {
    val json = Json.parse(stream)
    logger.log(s"Got JSON: $json")
    val request = Json.fromJson[Request](json)
    logger.log(s"Parsed request: $request")
    request.map { r =>
      FakeRequest(
        method = r.method,
        uri = r.uri,
        headers = FakeHeaders(r.params.header.toList),
        body = AnyContentAsEmpty
      )
    }.asOpt
  }

  def fromEvent(event: Map[String, Object])(implicit logger: LambdaLogger): FakeRequest[AnyContentAsEmpty.type] = {
    val method = event("method").asInstanceOf[String]
    val uri = event("uri").asInstanceOf[String]
    val headers = event.get("headers").map {
      case headerMap: JavaLinkedHashMap[_,_] =>
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

case class Request(method: String, uri: String, params: Params)

// TODO: body should really be a byte array
object Response {
  implicit val writes = Json.writes[Response]
}
case class Response(body: String, status: Int, reason: Option[String], headers: Map[String, String])

class LambdaEntrypoint extends Writeables {
  def run(lambdaRequest: InputStream, lambdaResponse: OutputStream, context: λContext): Unit = {
    implicit val logger = context.getLogger
    val request = Request.fromStream(lambdaRequest)

    // actually call the router
    val maybeResult = request.flatMap(Helpers.route(Loader.app, _)(Helpers.writeableOf_AnyContentAsEmpty))
    logger.log(maybeResult.fold(s"Route not found for $request")(_ => s"Successfully routed $request"))

    import Helpers.defaultAwaitTimeout

    maybeResult.foreach { of =>
      val body = Helpers.contentAsString(of)
      val result = Await.result(of, Helpers.defaultAwaitTimeout.duration)
      val response = Response(body = body, status = result.header.status, result.header.reasonPhrase, result.header.headers)
      logger.log(s"Response object:\n$response")
      val json = Json.toJson(response)
      lambdaResponse.write(json.toString.getBytes("UTF-8"))
      logger.log(s"Written JSON to response stream")
    }

    context.getLogger.log("Finished")
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
