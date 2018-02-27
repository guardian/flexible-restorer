import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.{AWS, RestorerConfig}
import controllers._
import helpers.{HSTSFilter, LogStash, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import permissions.Permissions
import com.typesafe.config.Config
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import router.Routes
import play.api.{BuiltInComponentsFromContext, Mode}

import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context, config: Config) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val restorerConfig = new RestorerConfig(config)

  val panDomainSettings: PanDomainAuthSettingsRefresher = new PanDomainAuthSettingsRefresher(
    domain = restorerConfig.domain,
    system = "restorer",
    awsCredentialsProvider = AWS.creds,
    actorSystem = actorSystem
  )

  if (context.environment.mode != Mode.Dev) LogStash.init(restorerConfig.loggingConfig)

  val permissionsClient = new Permissions(restorerConfig, AWS.creds)
  logger.info(s"Permissions object initialised with config: ${permissionsClient.config}")

  val snapshotApi = new SnapshotApi(AWS.s3Client)
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
