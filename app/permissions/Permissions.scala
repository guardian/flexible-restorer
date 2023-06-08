package permissions

import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import com.amazonaws.auth.{AWSCredentialsProvider, DefaultAWSCredentialsProviderChain}
import com.amazonaws.regions.Regions
import scala.concurrent.Future
import scala.concurrent.ExecutionContext


class Permissions(stage: String)(implicit ec: ExecutionContext) {
  private val app = "atom-maker"

  private val permissionDefinitions = Map(
    "restoreContent" -> PermissionDefinition(name = "restore_content", app),
    "restoreContentToAnyStack" -> PermissionDefinition(name = "restore_content_to_any_stack", app)
  )
  val RestoreContent: PermissionDefinition = PermissionDefinition("restore_content", app)
  val RestoreContentToAlternateStack: PermissionDefinition = PermissionDefinition("restore_content_to_any_stack", app)

  private val credentialsProvider: AWSCredentialsProvider = new DefaultAWSCredentialsProviderChain()
  private val permissions: PermissionsProvider = PermissionsProvider(PermissionsConfig(stage, Regions.DEFAULT_REGION.getName, credentialsProvider))

  def canRestoreContent(email: String): Boolean = permissions.hasPermission(permissionDefinitions("restoreContent"), email)

  def canRestoreContentToAnyStack(email: String): Boolean = permissions.hasPermission(permissionDefinitions("restoreContentToAnyStack"), email)


  def userPermissionMap(email: String): Future[Map[PermissionDefinition, Boolean]] = {
    val permissionFutures = permissionDefinitions.map { case (_, permission) =>
      val result = permissions.hasPermission(permission, email)
      Future.successful(permission -> result)
    }

    Future.sequence(permissionFutures).map(_.toMap)
  }


}
