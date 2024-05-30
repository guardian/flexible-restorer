package auth

import com.gu.pandomainauth.action.AuthActions
import com.gu.pandomainauth.model.AuthenticatedUser
import com.gu.permissions.{PermissionDefinition, PermissionsProvider}
import config.AppConfig
import helpers.Loggable
import permissions.Permissions
import play.api.mvc.{RequestHeader, Result, Results}

trait PanDomainAuthActions extends AuthActions with Loggable {
  def config: AppConfig

  def permissions: PermissionsProvider

  override def validateUser(authedUser: AuthenticatedUser): Boolean = {
    val isValid = (authedUser.user.emailDomain == "guardian.co.uk") && authedUser.multiFactor

    val hasRestorerAccess = permissions.hasPermission(Permissions.RestorerAccess, authedUser.user.email)

    if (!isValid) {
      logger.warn(s"User ${authedUser.user.email} failed validation")
    }
    if (!hasRestorerAccess) {
      logger.warn(s"User ${authedUser.user.email} doesn't have 'restorer_access' permission.")
    }

    isValid // && hasRestorerAccess TODO add this back in after two weeks of logs to actually enforce
  }

  override def showUnauthedMessage(message: String)(implicit request: RequestHeader): Result = {
    Results.Redirect(controllers.routes.Login.authError(message))
  }

  override def authCallbackUrl: String = config.hostName + "/oauthCallback"

}
