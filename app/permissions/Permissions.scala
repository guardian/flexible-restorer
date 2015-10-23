package permissions

import com.gu.editorial.permissions.client._
import com.gu.pandomainauth.model.AuthenticatedUser

import scala.concurrent.Await
import scala.concurrent.duration._
import scala.language.postfixOps

/**
 * Adapter for the Permissions client library
 */
object Permissions extends PermissionsProvider {
  val app = "composer-restorer"

  implicit def config = PermissionsConfig(
    app = app,
    all = all
  )

  val RestoreContent = Permission("restore_content", app, PermissionDenied)

  val all = Seq(RestoreContent)

  private val timeout = 2000 millis

  def hasAccess(user: AuthenticatedUser): Boolean = {
    implicit val permsUser = PermissionsUser(user.user.email)
    Await.result(getEither(RestoreContent).map(_.isRight), timeout)
  }
}
