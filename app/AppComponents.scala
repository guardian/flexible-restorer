import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.gu.editorial.permissions.client.PermissionsConfig
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
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

  def panDomainSettings: PanDomainAuthSettingsRefresher = new PanDomainAuthSettingsRefresher(
    domain = restorerConfig.domain,
    system = "restorer",
    awsCredentialsProvider = restorerConfig.creds,
    actorSystem = actorSystem
  )

  if (context.environment.mode == Mode.Prod) restorerConfig.loggingConfig.foreach(LogStash.init)

  val region: Regions = Regions.fromName(configuration.getOptional[String]("aws.region") getOrElse "eu-west-1")
  val s3Client: AmazonS3 = AmazonS3ClientBuilder.standard().withCredentials(restorerConfig.creds).withRegion(region).build()

  val permissionsClient = new Permissions(restorerConfig, restorerConfig.creds)
  val permissionsConfig: PermissionsConfig = permissionsClient.config
  logger.info(s"Permissions object initialised with config: $permissionsConfig")

  val snapshotApi = new SnapshotApi(s3Client)
  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, restorerConfig, wsClient, panDomainSettings)
  val loginController = new Login(controllerComponents, permissionsClient, restorerConfig, wsClient, panDomainSettings)
  val managementController = new Management(controllerComponents, restorerConfig, wsClient, panDomainSettings)
  val versionsController = new Versions(controllerComponents, restorerConfig, snapshotApi, wsClient, panDomainSettings)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, permissionsClient, restorerConfig, wsClient, panDomainSettings)

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
