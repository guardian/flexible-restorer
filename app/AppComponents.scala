import com.amazonaws.auth.DefaultAWSCredentialsProviderChain
import com.amazonaws.regions.{Region, Regions}
import com.amazonaws.services.s3.AmazonS3Client
import config.RestorerConfig
import play.api.ApplicationLoader.Context
import play.api.{BuiltInComponentsFromContext, Mode}
import play.api.routing.Router
import s3.S3
import controllers._
import helpers.{LogStash, Loggable}
import permissions.Permissions
import play.api.libs.ws.ahc.AhcWSComponents
import router.Routes

class AppComponents(context: Context) extends BuiltInComponentsFromContext(context) with AhcWSComponents with Loggable {
  val restorerConfig = new RestorerConfig(configuration)

  if (context.environment.mode == Mode.Prod) restorerConfig.loggingConfig.foreach(LogStash.init)

  val awsCredsProvider = new DefaultAWSCredentialsProviderChain()
  val region = Region getRegion Regions.fromName(configuration.getString("aws.region") getOrElse "eu-west-1")
  val s3Client: AmazonS3Client = new AmazonS3Client(awsCredsProvider).withRegion(region)

  val s3Helper = new S3(restorerConfig, s3Client)

  val permissionsClient = new Permissions(restorerConfig, awsCredsProvider)
  val permissionsConfig = permissionsClient.config
  logger.info(s"Permissions object initialised with config: $permissionsConfig")

  val applicationController = new Application(restorerConfig, wsClient)
  val loginController = new Login(permissionsClient, restorerConfig, wsClient)
  val managementController = new Management(restorerConfig, wsClient)
  val versionsController = new Versions(restorerConfig, s3Helper, wsClient)

  def router: Router = new Routes(
    httpErrorHandler,
    applicationController,
    loginController,
    new controllers.Assets(httpErrorHandler),
    managementController,
    versionsController
  )
}
