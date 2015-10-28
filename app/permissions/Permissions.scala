package permissions

import com.gu.editorial.permissions.client._
import com.gu.pandomainauth.model.AuthenticatedUser
import config.RestorerConfig

import scala.concurrent.Await
import scala.concurrent.duration._
import scala.language.postfixOps

/**
 * Adapter for the Permissions client library
 */
object Permissions extends PermissionsProvider {
  val app = "composer-restorer"

  val isEnabled = RestorerConfig.usePermissionsService

  implicit def config = {
    val stage = if (RestorerConfig.stage == "PROD") "PROD" else "CODE"

    PermissionsConfig(
      app = app,
      all = all,
      s3BucketPrefix = stage
    )
  }

  val RestoreContent = Permission("restore_content", app, PermissionDenied)

  val all = Seq(RestoreContent)

  private val timeout = 2000 millis

  def hasAccess(user: AuthenticatedUser): Boolean = {
    if (isEnabled) {
      implicit val permsUser = PermissionsUser(user.user.email)
      Await.result(getEither(RestoreContent).map(_.isRight), timeout)

    } else {
      // read from whitelist
      RestorerConfig.whitelistMembers.contains(user.user.email)
    }
  }
}
