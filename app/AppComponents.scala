import com.gu.AppIdentity
import com.gu.pandomainauth.{PanDomainAuthSettingsRefresher, S3BucketLoader}
import com.gu.permissions.{
  PermissionsConfig,
  PermissionsProvider,
  PermissionsS3,
  S3PermissionsProvider
}
import config.AppConfig
import config.AWS._
import controllers._
import helpers.{HSTSFilter, Loggable}
import logic.{FlexibleApi, SnapshotApi}
import play.api.ApplicationLoader.Context
import scala.io.Source
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.BuiltInComponentsFromContext
import router.Routes

import scala.concurrent.ExecutionContext.Implicits.{
  global => globalExecutionContext
}

class AppComponents(context: Context, identity: AppIdentity) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable with AssetsComponents {

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val config = new AppConfig(configuration, identity)

  private val permissionsConfig = PermissionsConfig(
    stage = config.effectiveStage,
    region = config.region,
    awsCredentials = credentials
  )

  // In local mode, use our app-level S3 client so path-style and endpoint overrides apply to permissions fetches too.
  val permissions: PermissionsProvider =
    if (sys.props.get("local").contains("true")) {
      // AWS_ENDPOINT_URL_S3 only changes endpoint selection; it does not force path-style addressing.
      // Reusing the app-configured s3Client keeps MinIO-compatible path-style behavior for permissions fetches.
      val provider = new S3PermissionsProvider(
        permissionsConfig.s3Bucket,
        PermissionsConfig.getPermissionsFileKey(permissionsConfig),
        permissionsConfig.refreshFrequency,
        PermissionsS3(s3Client)
      )
      provider.start()
      provider
    } else {
      val provider = PermissionsProvider(permissionsConfig)
      provider
    }

  val panDomainSettings: PanDomainAuthSettingsRefresher =
    PanDomainAuthSettingsRefresher(
      domain = config.domain,
      system = "restorer",
      S3BucketLoader.forAwsSdkV2(s3Client, "pan-domain-auth-settings")
    )

  val snapshotApi = new SnapshotApi(s3Client)

  val flexibleApi = new FlexibleApi(wsClient)

  val applicationController = new Application(controllerComponents, config, wsClient, permissions, panDomainSettings)
  val loginController = new Login(controllerComponents, config, wsClient, permissions, panDomainSettings)
  val managementController = new Management(controllerComponents, config, wsClient, permissions, panDomainSettings)
  val versionsController = new Versions(controllerComponents, config, snapshotApi, wsClient, permissions, panDomainSettings)
  val restoreController = new Restore(controllerComponents, snapshotApi, flexibleApi, config, wsClient, permissions, panDomainSettings)
  val exportController = new Export(controllerComponents, snapshotApi, config, wsClient, permissions, panDomainSettings)

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
