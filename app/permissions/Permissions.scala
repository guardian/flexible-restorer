import com.amazonaws.auth.{AWSCredentialsProvider, DefaultAWSCredentialsProviderChain}
import com.amazonaws.regions.Regions
import com.gu.permissions.{PermissionDefinition, PermissionsConfig, PermissionsProvider}
import config.AWS

class Permissions(stage: String) {
  private val app = "atom-maker"

  private val permissionDefinitions = Map(
    "restoreContent" -> PermissionDefinition(name = "restore_content", app)
  )

  private val credentialsProvider: AWSCredentialsProvider = new DefaultAWSCredentialsProviderChain()
  private val permissions: PermissionsProvider = PermissionsProvider(PermissionsConfig(stage, Regions.DEFAULT_REGION.getName, credentialsProvider))

  def canRestoreContent(email: String): Boolean = permissions.hasPermission(permissionDefinitions("restoreContent"), email)
}
