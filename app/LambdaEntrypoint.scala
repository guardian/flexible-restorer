import java.io.{File, InputStream, OutputStream}

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import com.amazonaws.services.lambda.runtime.{LambdaLogger, Context => λContext}
import play.api.ApplicationLoader.Context
import play.api.libs.json.Json
import play.api.mvc.{AnyContentAsEmpty, Result}
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

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

object LambdaRequest {
  implicit val reads = Json.reads[LambdaRequest]
}
case class LambdaRequest(
  httpMethod: String,
  path: String,
  queryStringParameters: Option[Map[String, String]],
  headers: Option[Map[String, String]],
  body: Option[String]
)

object LambdaResponse {
  implicit val writes = Json.writes[LambdaResponse]
}
case class LambdaResponse(
  statusCode: Int,
  headers: Map[String, String] = Map.empty,
  body: String = ""
)

object RequestParser {
  def buildPath(uri: String, pathParams: Map[String, String]): String = {
    pathParams.foldLeft(uri){ case (acc, (key, value)) => acc.replace(s"{$key}", value) }
  }

  // TODO: this should really return an either with better error reporting
  def fromStream(stream: InputStream)(implicit logger: LambdaLogger): Option[FakeRequest[AnyContentAsEmpty.type]] = {
    val json = Json.parse(stream)
    logger.log(s"Got JSON: $json")
    val request = Json.fromJson[LambdaRequest](json)
    logger.log(s"Parsed request: $request")
    request.map { r =>
      val queryString = for {
        queryMap <- r.queryStringParameters.toList
        (name, value) <- queryMap
      } yield s"$name=$value"
      val pathWithQueryString =
        if (queryString.isEmpty) r.path
        else queryString.mkString(s"${r.path}?", "&", "")
      FakeRequest(
        method = r.httpMethod,
        uri = pathWithQueryString,
        headers = FakeHeaders(r.headers.map(_.toList).getOrElse(Nil)),
        body = AnyContentAsEmpty
      )
    }.asOpt
  }
}

object Response {
  implicit val writes = Json.writes[Response]
}
case class Response(body: String, status: Int, reason: Option[String], headers: Map[String, String])

class LambdaEntrypoint extends Writeables {
  import LambdaEntrypoint.materializer

  def run(lambdaRequest: InputStream, lambdaResponse: OutputStream, context: λContext): Unit = {
    implicit val logger = context.getLogger
    val request = RequestParser.fromStream(lambdaRequest)

    // actually call the router
    val maybeResult = request.flatMap(Helpers.route(LambdaEntrypoint.app, _)(Helpers.writeableOf_AnyContentAsEmpty))
    logger.log(maybeResult.fold(s"Route not found for $request")(_ => s"Successfully routed $request"))

    import Helpers.defaultAwaitTimeout

    val response = maybeResult.fold {
      LambdaResponse(404, body = "Route not found")
    }
    { futureResult =>
      val body = Helpers.contentAsBytes(futureResult).decodeString("utf-8")
      val result: Result = Await.result(futureResult, Helpers.defaultAwaitTimeout.duration)

      val headers = result.header.headers ++
        result.body.contentType.map("Content-Type" ->) ++
        result.body.contentLength.map("Content-Length" -> _.toString)

      LambdaResponse(
        statusCode = result.header.status,
        headers = headers,
        body = body
      )
    }

    logger.log(s"Response object:\n$response")
    val json = Json.toJson(response)
    lambdaResponse.write(json.toString.getBytes("UTF-8"))
    lambdaResponse.flush()
    logger.log(s"Written JSON to response stream")

    context.getLogger.log("Finished")
  }
}
