import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import com.typesafe.config.Config
import config.{AWS, RestorerConfig}
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

  val pandaS3Client: AmazonS3 = AmazonS3ClientBuilder.standard().withCredentials(AWS.creds).withRegion(Regions.EU_WEST_1).build()

  val panDomainSettings: PanDomainAuthSettingsRefresher = new PanDomainAuthSettingsRefresher(
    domain = restorerConfig.domain,
    system = "restorer",
    bucketName = "pan-domain-auth-settings",
    settingsFileKey = s"${restorerConfig.domain}.settings",
    s3Client = pandaS3Client
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
  val exportController = new Export(controllerComponents, snapshotApi, restorerConfig, wsClient, panDomainSettings)

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
