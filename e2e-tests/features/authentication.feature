Feature: Authenticate users and gate access
  This allows the app to accept signed-in Guardian users
  And to block access when a user is unauthenticated or lacks permission

  Background:
    Given the application stack is running

  Scenario: A protected page is only available to signed-in users with restorer access
    When I request the restorer homepage signed in without restorer access
    Then I am redirected to the access denied page
    And the page title should say Composer Restorer - Access denied
    And the page should explain how to contact Central Production for help
  # Evidence: app/auth/PanDomainAuthActions.scala#L17-L29 (validateUser restorer_access gate)
  # Evidence: app/views/authError.scala.html#L6-L13 (access denied title & Central Production link)
  # Evidence: conf/routes#L10 (authError route)


  Scenario: The access denied page shows the message returned by auth
    When authentication fails with a message
    Then the access denied page should display that message
    And the page should keep the Central Production contact link visible
  # Evidence: app/controllers/Login.scala#L32-L34 (authError action)
  # Evidence: app/views/authError.scala.html#L12-L13 (message & contact link)

  Scenario: The app exposes the current signed-in user
    Given I am signed in through pan-domain auth
    When the frontend requests the current user
    Then the API should return the current user details as JSON
  # Evidence: app/controllers/Login.scala#L36-L38 (user action)
  # Evidence: conf/routes#L22 (/api/1/user route)
  # Evidence: public/javascripts/app/services/UserService.js#L15-L23 (fetchUserWithPermissions)

  Scenario: The app exposes the current user permissions
    Given I am signed in through pan-domain auth
    When the frontend requests the current user permissions
    Then the API should return the permission map as JSON
    And the permission map should include whether I have restore_content permission
    And the permission map should include whether I have restore_content_to_any_stack permission
    And the permission map should not include the restorer_access gate permission
  # Evidence: app/controllers/Login.scala#L40-L46 (usersPermissions action)
  # Evidence: app/permissions/Permissions.scala#L9-L13 (restore permissions & all, gate excluded)
  # Evidence: public/javascripts/app/services/UserService.js#L15-L23 (permissions fetch)

  Scenario Outline: Protected routes use the same auth gate as the main app
    When I open the protected route <route>
    Then I should be allowed through with restorer access
    And I should be blocked without restorer access

    Examples:
      | route                                                |
      | /                                                    |
      | /content/568c4110e4b0c73bdb0e52df/versions           |
      | /api/1/versionList/568c4110e4b0c73bdb0e52df          |
      | /api/1/version-count/568c4110e4b0c73bdb0e52df        |
      | /api/1/user                                          |
      | /api/1/user/permissions                              |
      | /export/568c4110e4b0c73bdb0e52df/zip                 |
      | /export/568c4110e4b0c73bdb0e52df/git                 |
      | /api/1/restore/destinations/568c4110e4b0c73bdb0e52df |
  # All protected controllers share the restorer_access gate
  # (PanDomainAuthActions.validateUser). The restore POST endpoint additionally
  # requires restore_content / restore_content_to_any_stack, which is covered by
  # the content snapshot restore scenarios.
  # Evidence: app/auth/PanDomainAuthActions.scala#L17-L29 (shared validateUser gate)
  # Evidence: app/controllers/Application.scala#L39-L45 (index & versionIndex AuthAction)
  # Evidence: app/controllers/Export.scala#L44 & #L69 (exportAsZip / exportAsGitRepo AuthAction)
  # Evidence: app/controllers/Versions.scala#L25, #L37, #L64 (show / versionList / availableVersionsCount AuthAction)
  # Evidence: app/controllers/Restore.scala#L32 & #L52 (restore / restoreDestinations AuthAction)