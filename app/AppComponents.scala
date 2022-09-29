import com.typesafe.config.Config
import config.RestorerConfig
import config.AWS._
import controllers._
import helpers.{HSTSFilter, LogStash, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import permissions.Permissions
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, Mode}
import router.Routes

import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context, config: Config) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val restorerConfig = new RestorerConfig(config)

  if (context.environment.mode != Mode.Dev) LogStash.init(restorerConfig.loggingConfig)

  val permissionsClient = new Permissions(restorerConfig)
  logger.info(s"Permissions object initialised with config: ${permissionsClient.config}")

  val snapshotApi = new SnapshotApi(s3Client)

  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, restorerConfig, wsClient, restorerConfig.panDomainSettings)
  val loginController = new Login(controllerComponents, permissionsClient, restorerConfig, wsClient, restorerConfig.panDomainSettings)
  val managementController = new Management(controllerComponents, restorerConfig, wsClient, restorerConfig.panDomainSettings)
  val versionsController = new Versions(controllerComponents, restorerConfig, snapshotApi, wsClient, restorerConfig.panDomainSettings)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, permissionsClient, restorerConfig, wsClient, restorerConfig.panDomainSettings)
  val exportController = new Export(controllerComponents, snapshotApi, restorerConfig, wsClient, restorerConfig.panDomainSettings)

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
