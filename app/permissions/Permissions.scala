package permissions

import com.amazonaws.auth.AWSCredentialsProvider
import com.gu.editorial.permissions.client._
import com.gu.pandomainauth.model.User
import config.RestorerConfig

import scala.concurrent.Await
import scala.concurrent.duration._
import scala.language.postfixOps

/**
 * Adapter for the Permissions client library
 */
class Permissions(restorerConfig: RestorerConfig, credsProvider: AWSCredentialsProvider) extends PermissionsProvider {
  val app = "composer-restorer"

  implicit def config = {
    val stage = if (restorerConfig.stage == "PROD") "PROD" else "CODE"

    PermissionsConfig(
      app = app,
      all = all,
      s3BucketPrefix = stage,
      awsCredentials = credsProvider


    )
  }

  val RestoreContent = Permission("restore_content", app, PermissionDenied)

  val all = Seq(RestoreContent)

  private val timeout = 2000 millis

  def hasAccess(user: User): Boolean = {
    implicit val permsUser = PermissionsUser(user.email)
    Await.result(getEither(RestoreContent).map(_.isRight), timeout)
  }
}
