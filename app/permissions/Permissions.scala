package permissions

import com.gu.permissions.PermissionDefinition

object Permissions {
  val app = "composer-restorer"

  val RestorerAccess: PermissionDefinition = PermissionDefinition("restorer_access", app)

  val RestoreContent: PermissionDefinition = PermissionDefinition("restore_content", app)

  val RestoreContentToAlternateStack: PermissionDefinition = PermissionDefinition("restore_content_to_any_stack", app)

  val all: Seq[PermissionDefinition] = Seq(RestoreContent, RestoreContentToAlternateStack)
}
