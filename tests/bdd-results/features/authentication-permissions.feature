@authentication-permissions
Feature: Authentication & Permissions
  As the application
  I want to admit only authorised Guardian users
  So that content history and restores stay protected

  Scenario: Block access for users without restorer access
    Given I am not an authorised restorer user
    When I try to use the application
    Then I am shown an access denied page explaining how to get help
  # Evidence: app/auth/PanDomainAuthActions.scala
  # Evidence: app/views/authError.scala.html
  # Evidence: controllers.Login.authError (GET /authError)

  Scenario: Admit signed-in users with restorer access
    Given I am an authorised restorer user
    When I open the application
    Then I am allowed to use it
  # Evidence: app/auth/PanDomainAuthActions.scala
  # Evidence: controllers.Application.index (GET /)

  Scenario: Make the current user available to the application
    Given I am a signed-in user
    When the application needs my identity
    Then my user details are provided
  # Evidence: controllers.Login.user (GET /api/1/user)
  # Evidence: public/javascripts/app/services/UserService.js

  Scenario: Make my permissions available to the application
    Given I am a signed-in user
    When the application needs my permissions
    Then my permission set is provided so features can adapt to what I may do
  # Evidence: controllers.Login.usersPermissions (GET /api/1/user/permissions)
  # Evidence: app/permissions/Permissions.scala
  # Evidence: public/javascripts/app/services/UserService.js
