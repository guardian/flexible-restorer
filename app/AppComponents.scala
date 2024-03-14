import com.gu.AppIdentity
import com.gu.permissions.{PermissionsConfig, PermissionsProvider}
import config.AppConfig
import config.AWS._
import controllers._
import helpers.{HSTSFilter, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import permissions.Permissions
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.BuiltInComponentsFromContext
import router.Routes

import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context, identity: AppIdentity) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val config = new AppConfig(configuration, identity)

  val permissionsConfig = PermissionsConfig(
    stage = config.stage,
    region = config.region,
    awsCredentials = credentialsV1
  )
  val permissionsClient = PermissionsProvider(permissionsConfig)

  val snapshotApi = new SnapshotApi(s3Client)

  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, config, wsClient, config.panDomainSettings)
  val loginController = new Login(controllerComponents, permissionsClient, config, wsClient, config.panDomainSettings)
  val managementController = new Management(controllerComponents, config, wsClient, config.panDomainSettings)
  val versionsController = new Versions(controllerComponents, config, snapshotApi, wsClient, config.panDomainSettings)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, permissionsClient, config, wsClient, config.panDomainSettings)
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
