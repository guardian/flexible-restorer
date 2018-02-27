package permissions

import com.amazonaws.auth.AWSCredentialsProvider
import com.gu.editorial.permissions.client.{PermissionGranted, _}
import com.gu.pandomainauth.model.User
import config.{AWS, RestorerConfig}

import scala.concurrent.Future
import scala.language.postfixOps

/**
 * Adapter for the Permissions client library
 */
class Permissions(restorerConfig: RestorerConfig, credsProvider: AWSCredentialsProvider) extends PermissionsProvider {
  val app = "composer-restorer"

  implicit def config = {
    val stage = if (AWS.stage == "PROD") "PROD" else "CODE"

    PermissionsConfig(
      app = app,
      all = all,
      s3BucketPrefix = stage,
      awsCredentials = credsProvider
    )
  }

  val RestoreContent = Permission("restore_content", app, PermissionDenied)

  val RestoreContentToAlternateStack = Permission("restore_content_to_any_stack", app, PermissionDenied)

  val all = Seq(RestoreContent, RestoreContentToAlternateStack)

  def isGranted(user: User, permission: Permission): Future[Boolean] = {
    get(permission)(PermissionsUser(user.email)).map {
      case PermissionGranted => true
      case _ => false
    }
  }

  def userPermissionMap(user: User): Future[Map[Permission, Boolean]] =
    Future.sequence(all.map(p => isGranted(user, p).map(p ->))).map(_.toMap)
}
