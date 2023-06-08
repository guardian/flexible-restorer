import com.amazonaws.auth.DefaultAWSCredentialsProviderChain
import com.amazonaws.regions.Regions
import com.gu.AppIdentity
import config.AppConfig
import config.AWS._
import controllers._
import helpers.{HSTSFilter, LogStash, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.BuiltInComponentsFromContext
import router.Routes
import permissions.Permissions
import scala.concurrent.ExecutionContext


import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context, identity: AppIdentity)(implicit ec: ExecutionContext) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val config = new AppConfig(configuration, identity)

  if (config.stage != "DEV") LogStash.init(config)

  val permissionsClient = new Permissions(config.stage)

  val permissionsProvider = PermissionsProvider(PermissionsConfig(config.stage, Regions.DEFAULT_REGION.getName, credentialsProvider))
  logger.info(s"Permissions object initialised with config: ${permissionsClient.toString}")


  val snapshotApi = new SnapshotApi(s3Client)

  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, config, wsClient, config.panDomainSettings)
  val credentialsProvider = new DefaultAWSCredentialsProviderChain()
  val loginController = new Login(controllerComponents, permissionsProvider, config, wsClient, config.panDomainSettings)
  val managementController = new Management(controllerComponents, config, wsClient, config.panDomainSettings)
  val versionsController = new Versions(controllerComponents, config, snapshotApi, wsClient, config.panDomainSettings)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, permissionsProvider, config, wsClient, config.panDomainSettings)
  val exportController = new Export(controllerComponents, snapshotApi, config, wsClient, config.panDomainSettings)

  def router: Router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    assets,
    managementController,
    versionsController,
    restoreController,
    exportController
  )
}
