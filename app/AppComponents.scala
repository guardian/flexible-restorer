import com.amazonaws.regions.{Region, Regions}
import com.amazonaws.services.s3.AmazonS3Client
import com.gu.editorial.permissions.client.PermissionsConfig
import config.RestorerConfig
import controllers._
import helpers.{HSTSFilter, LogStash, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import permissions.Permissions
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, LoggerConfigurator, Mode}
import router.Routes

import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {
  LoggerConfigurator(context.environment.classLoader).foreach {
    _.configure(context.environment)
  }

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val restorerConfig = new RestorerConfig(configuration)

  if (context.environment.mode == Mode.Prod) restorerConfig.loggingConfig.foreach(LogStash.init)

  val region: Region = Region getRegion Regions.fromName(configuration.getOptional[String]("aws.region") getOrElse "eu-west-1")
  val s3Client: AmazonS3Client = new AmazonS3Client(restorerConfig.creds).withRegion(region)

  val permissionsClient = new Permissions(restorerConfig, restorerConfig.creds)
  val permissionsConfig: PermissionsConfig = permissionsClient.config
  logger.info(s"Permissions object initialised with config: $permissionsConfig")

  val snapshotApi = new SnapshotApi(s3Client)
  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, restorerConfig, wsClient)
  val loginController = new Login(controllerComponents, permissionsClient, restorerConfig, wsClient)
  val managementController = new Management(controllerComponents, restorerConfig, wsClient)
  val versionsController = new Versions(controllerComponents, restorerConfig, snapshotApi, wsClient)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, permissionsClient, restorerConfig, wsClient)

  def router: Router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    assets,
    managementController,
    versionsController,
    restoreController
  )
}
