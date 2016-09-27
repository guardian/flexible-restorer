import java.io.{File, InputStream, OutputStream}
import java.util.{LinkedHashMap => JavaLinkedHashMap}

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import com.amazonaws.services.lambda.runtime.{LambdaLogger, Context => λContext}
import com.amazonaws.util.BinaryUtils
import play.api.ApplicationLoader.Context
import play.api.libs.json.Json
import play.api.mvc.{AnyContentAsEmpty, Result}
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

import scala.collection.JavaConverters._
import scala.concurrent.Await
import scala.language.postfixOps

object LambdaEntrypoint {
  implicit val system = ActorSystem("LambdaActorSystem")
  implicit val materializer = ActorMaterializer()
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
case class Params(header: Map[String, String], path: Map[String, String])

object Request {
  implicit val reads = Json.reads[Request]

  def buildPath(uri: String, pathParams: Map[String, String]): String = {
    pathParams.foldLeft(uri){ case (acc, (key, value)) => acc.replace(s"{$key}", value) }
  }

  // TODO: this should really return an either with better error reporting
  def fromStream(stream: InputStream)(implicit logger: LambdaLogger): Option[FakeRequest[AnyContentAsEmpty.type]] = {
    val json = Json.parse(stream)
    logger.log(s"Got JSON: $json")
    val request = Json.fromJson[Request](json)
    logger.log(s"Parsed request: $request")
    request.map { r =>
      val substitutedPath = buildPath(r.uri, r.params.path)
      FakeRequest(
        method = r.method,
        uri = substitutedPath,
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
  import LambdaEntrypoint.materializer

  def run(lambdaRequest: InputStream, lambdaResponse: OutputStream, context: λContext): Unit = {
    implicit val logger = context.getLogger
    val request = Request.fromStream(lambdaRequest)

    // actually call the router
    val maybeResult = request.flatMap(Helpers.route(LambdaEntrypoint.app, _)(Helpers.writeableOf_AnyContentAsEmpty))
    logger.log(maybeResult.fold(s"Route not found for $request")(_ => s"Successfully routed $request"))

    import Helpers.defaultAwaitTimeout

    maybeResult.foreach { of =>
      val body = BinaryUtils.toBase64(Helpers.contentAsBytes(of).toArray)
      val result: Result = Await.result(of, Helpers.defaultAwaitTimeout.duration)
      val headers = result.header.headers ++
        result.body.contentType.map("Content-Type" ->) ++
        result.body.contentLength.map("Content-Length" -> _.toString)
      val response = Response(body = body, status = result.header.status, result.header.reasonPhrase, headers)
      logger.log(s"Response object:\n$response")
      val json = Json.toJson(response)
      lambdaResponse.write(json.toString.getBytes("UTF-8"))
      lambdaResponse.flush()
      logger.log(s"Written JSON to response stream")
      if (response.status != 200) {
        throw new LocationException(s"status=${response.status}", response.headers("Location"))
      }
    }

    context.getLogger.log("Finished")
  }
}

class LocationException(errorMessage: String, location: String) extends Exception(errorMessage) {
  val locationQuery = if (location.contains('?')) "&ignoreThisQueryParameter=" else "?ignoreThisQueryParameter="
  val locationElement = new StackTraceElement(s"$location$locationQuery", "", "", 0)
  override def getStackTrace: Array[StackTraceElement] = Seq(locationElement).toArray
}