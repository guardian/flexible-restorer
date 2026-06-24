Feature: Authenticate users and gate access
  This allows the app to accept signed-in Guardian users
  And to block access when a user is unauthenticated or lacks permission

  Background:
    Given the application stack is running

  Scenario: A protected page is only available to signed-in users with access
    When I request the restorer homepage without an authenticated session
    Then I am redirected to the access denied page
    And the page title should say Composer Restorer - Access denied
    And the page should explain how to contact Central Production for help
  # Evidence: app/auth/PanDomainAuthActions.scala
  # Evidence: app/views/authError.scala.html
  # Evidence: conf/routes

  Scenario: The access denied page shows the message returned by auth
    When authentication fails with a message
    Then the access denied page should display that message
    And the page should keep the Central Production contact link visible
  # Evidence: app/controllers/Login.scala
  # Evidence: app/views/authError.scala.html

  Scenario: The app exposes the current signed-in user
    Given I am signed in through pan-domain auth
    When the frontend requests the current user
    Then the API should return the current user details as JSON
  # Evidence: app/controllers/Login.scala
  # Evidence: conf/routes
  # Evidence: public/javascripts/app/services/UserService.js

  Scenario: The app exposes the current user permissions
    Given I am signed in through pan-domain auth
    When the frontend requests the current user permissions
    Then the API should return the permission map as JSON
    And the permission map should include whether I have restore_content permission
    And the permission map should include whether I have restore_content_to_any_stack permission
    And the permission map should not include the restorer_access gate permission
  # Evidence: app/controllers/Login.scala
  # Evidence: app/permissions/Permissions.scala
  # Evidence: public/javascripts/app/services/UserService.js

  Scenario: Protected routes use the same auth gate as the main app
    Given I am signed in through pan-domain auth
    When I open a protected route in the restorer app
    Then I should be allowed through if I have restorer access
    And I should be blocked if I do not have restorer access
  # Evidence: app/auth/PanDomainAuthActions.scala
  # Evidence: app/controllers/Application.scala
  # Evidence: app/controllers/Export.scala
  # Evidence: app/controllers/Versions.scala
  # Evidence: app/controllers/Restore.scala