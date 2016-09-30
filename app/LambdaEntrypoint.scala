import java.io._

import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import com.amazonaws.services.lambda.runtime.{LambdaLogger, Context => λContext}
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.model.{CannedAccessControlList, ObjectMetadata, PutObjectRequest}
import org.joda.time.DateTime
import play.api.ApplicationLoader.Context
import play.api.http.{HeaderNames, Status}
import play.api.libs.json.{JsResult, Json}
import play.api.mvc.{AnyContentAsEmpty, Cookies, Result}
import play.api.test.{FakeHeaders, FakeRequest, Helpers, Writeables}
import play.api.{Configuration, Environment, Mode, Play}
import play.core.DefaultWebCommands

import scala.concurrent.Await
import scala.language.postfixOps
import scala.util.control.NonFatal

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
  val components = new AppComponents(appContext)
  val app = components.application
  println("Now I have an application!")

  Play.start(app)
  println("Play application started")

  val s3Client = new AmazonS3Client()
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
  def fromStream(stream: InputStream)(implicit logger: LambdaLogger): Option[LambdaRequest] = {
    val json = Json.parse(stream)
    logger.log(s"Got JSON: $json")
    val request = Json.fromJson[LambdaRequest](json)
    logger.log(s"Parsed request: $request")
    request.asOpt
  }

  def transform(request: LambdaRequest): FakeRequest[AnyContentAsEmpty.type] = {
    val queryString = for {
      queryMap <- request.queryStringParameters.toList
      (name, value) <- queryMap
    } yield s"$name=$value"
    val pathWithQueryString =
      if (queryString.isEmpty) request.path
      else queryString.mkString(s"${request.path}?", "&", "")
    FakeRequest(
      method = request.httpMethod,
      uri = pathWithQueryString,
      headers = FakeHeaders(request.headers.map(_.toList).getOrElse(Nil)),
      body = AnyContentAsEmpty
    )
  }
}

object HttpConstants extends Status with HeaderNames {
  val mimeTypeTextWhitelist = Seq(
    "text/",
    "application/javascript",
    "application/json",
    "image/svg+xml"
  )
  def isBinaryType(contentType: String): Boolean = !mimeTypeTextWhitelist.exists(contentType.startsWith)
}

class LambdaEntrypoint extends Writeables {
  import LambdaEntrypoint.materializer

  def run(lambdaRequest: InputStream, lambdaResponse: OutputStream, context: λContext): Unit = {
    implicit val logger = context.getLogger
    logger.log(s"Running at ${DateTime.now()}")

    // actually call the router
    val maybeResponse: Option[LambdaResponse] = try {
      for {
        lambdaRequest <- RequestParser.fromStream(lambdaRequest)
        playRequest = RequestParser.transform(lambdaRequest)
      } yield {
        val maybeResult = Helpers.route(LambdaEntrypoint.app, playRequest)(Helpers.writeableOf_AnyContentAsEmpty)
        logger.log(maybeResult.fold(s"Route not found for $lambdaRequest")(_ => s"Successfully routed $lambdaRequest"))

        import Helpers.defaultAwaitTimeout

        maybeResult.fold {
          LambdaResponse(HttpConstants.NOT_FOUND, body = "Route not found")
        } { futureResult =>
          val bytes = Helpers.contentAsBytes(futureResult)
          val result: Result = Await.result(futureResult, Helpers.defaultAwaitTimeout.duration)

          val headerMap = result.header.headers ++
            result.body.contentType.map("Content-Type" ->) ++
            result.body.contentLength.map("Content-Length" -> _.toString)

          val cookies = Cookies.fromSetCookieHeader(result.header.headers.get(HttpConstants.SET_COOKIE)).toList.sortBy { cookie =>
            if (cookie.name == "gutoolsAuth-assym") 0 else 1
          }

          val selectedCookie = cookies match {
            case cookie :: otherCookies =>
              otherCookies.foreach { cookie =>
                logger.log(s"WARNING: Not setting cookie ${cookie.name} due to AWS bug")
              }
              Some(HttpConstants.SET_COOKIE -> Cookies.encodeSetCookieHeader(Seq(cookie)))
            case _ => None
          }

          val headers = headerMap ++ selectedCookie

          (result.body.contentType, bytes.nonEmpty) match {
            case (_, false) =>
              // no body at all
              LambdaResponse(
                statusCode = result.header.status,
                headers = headers
              )
            case (Some(contentType), true) if !HttpConstants.isBinaryType(contentType) =>
              // text body - parse as UTF-8 and return
              val body = bytes.decodeString("utf-8")
              LambdaResponse(
                statusCode = result.header.status,
                headers = headers,
                body = body
              )
            case (Some(contentType), true) if HttpConstants.isBinaryType(contentType) =>
              // binary body - upload and redirect to S3
              val bais = new ByteArrayInputStream(bytes.toArray)
              val metadata = new ObjectMetadata()
              headers.foreach { case(name, value) => metadata.setHeader(name, value) }
              metadata.setContentLength(bytes.length)
              val path = s"${context.getAwsRequestId}${lambdaRequest.path}"
              val bucket = "flexible-restorer-lambda-code2-binary-data"
              // this shouldn't really be public - should use signed URLs instead
              val request = new PutObjectRequest(bucket, path, bais, metadata).withCannedAcl(CannedAccessControlList.PublicRead)
              val response = LambdaEntrypoint.s3Client.putObject(request)
              val url = LambdaEntrypoint.s3Client.getUrl(bucket, path)
              LambdaResponse(
                statusCode = HttpConstants.SEE_OTHER,
                headers = Map("Location" -> url.toString)
              )
            case (None, true) =>
              // ??? problem, body but no type
              LambdaResponse(statusCode = HttpConstants.BAD_GATEWAY, body = "body to return but no Content-Type specified by play app")
          }
        }
      }
    } catch {
      case NonFatal(e) => Some(LambdaResponse(statusCode = HttpConstants.INTERNAL_SERVER_ERROR, body = stackTraceString(e)))
    }

    maybeResponse.foreach{ response =>
      logger.log(s"Response object:\n$response")
      val json = Json.toJson(response)
      lambdaResponse.write(json.toString.getBytes("UTF-8"))
      lambdaResponse.flush()
      logger.log(s"Written JSON to response stream")
    }

    context.getLogger.log("Finished")
  }

  private def stackTraceString(t: Throwable): String = {
    val sw = new StringWriter
    t.printStackTrace(new PrintWriter(sw))
    sw.toString
  }
}
