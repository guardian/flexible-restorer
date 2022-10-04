package permissions

import com.amazonaws.auth.AWSCredentialsProvider
import com.gu.editorial.permissions.client._
import com.gu.pandomainauth.model.User
import config.AWS._

import scala.concurrent.Future
import scala.language.postfixOps

/**
 * Adapter for the Permissions client library
 */
class Permissions(stage: String, awsCredentials: AWSCredentialsProvider = credentialsV1) extends PermissionsProvider {
  val app = "composer-restorer"

  implicit def config: PermissionsConfig = {
    val s3BucketPrefix = if (stage == "PROD") "PROD" else "CODE"

    PermissionsConfig(
      app = app,
      all = all,
      s3BucketPrefix = s3BucketPrefix,
      awsCredentials = awsCredentials
    )
  }

  val RestoreContent: Permission = Permission("restore_content", app, PermissionDenied)

  val RestoreContentToAlternateStack: Permission = Permission("restore_content_to_any_stack", app, PermissionDenied)

  val all: Seq[Permission] = Seq(RestoreContent, RestoreContentToAlternateStack)

  def isGranted(user: User, permission: Permission): Future[Boolean] = {
    get(permission)(PermissionsUser(user.email)).map {
      case PermissionGranted => true
      case _ => false
    }
  }

  def userPermissionMap(user: User): Future[Map[Permission, Boolean]] =
    Future.sequence(all.map(p => isGranted(user, p).map(p ->))).map(_.toMap)
}
