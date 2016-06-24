import com.amazonaws.auth.DefaultAWSCredentialsProviderChain
import com.amazonaws.regions.{Region, Regions}
import com.amazonaws.services.s3.AmazonS3Client
import config.RestorerConfig
import controllers._
import helpers.{HSTSFilter, LogStash, Loggable}
import permissions.Permissions
import play.api.ApplicationLoader.Context
import play.api.libs.ws.ahc.AhcWSComponents
import play.api.mvc.EssentialFilter
import play.api.routing.Router
import play.api.{BuiltInComponentsFromContext, LoggerConfigurator, Mode}
import logic.SnapshotStore
import router.Routes

import scala.concurrent.ExecutionContext.Implicits.{global => globalExecutionContext}

class AppComponents(context: Context) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable {
  LoggerConfigurator(context.environment.classLoader).foreach {
    _.configure(context.environment)
  }

  override lazy val httpFilters: Seq[EssentialFilter] = Seq(new HSTSFilter()(materializer, globalExecutionContext))

  val restorerConfig = new RestorerConfig(configuration)

  if (context.environment.mode == Mode.Prod) restorerConfig.loggingConfig.foreach(LogStash.init)

  val awsCredsProvider = new DefaultAWSCredentialsProviderChain()
  val region = Region getRegion Regions.fromName(configuration.getString("aws.region") getOrElse "eu-west-1")
  val s3Client: AmazonS3Client = new AmazonS3Client(awsCredsProvider).withRegion(region)

  val snapshotStores = Map(
    "primary" -> new SnapshotStore(restorerConfig.snapshotBucket, s3Client),
    "secondary" -> new SnapshotStore(restorerConfig.secondarySnapshotBucket, s3Client)
  )

  val permissionsClient = new Permissions(restorerConfig, awsCredsProvider)
  val permissionsConfig = permissionsClient.config
  logger.info(s"Permissions object initialised with config: $permissionsConfig")

  val applicationController = new Application(restorerConfig, wsClient)
  val loginController = new Login(permissionsClient, restorerConfig, wsClient)
  val managementController = new Management(restorerConfig, wsClient)
  val versionsController = new Versions(restorerConfig, snapshotStores, wsClient)
  val restoreController = new Restore(snapshotStores, restorerConfig, wsClient)

  def router: Router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    new controllers.Assets(httpErrorHandler),
    managementController,
    versionsController,
    restoreController
  )
}
