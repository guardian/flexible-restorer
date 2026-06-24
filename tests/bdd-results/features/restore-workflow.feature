@restore-workflow
Feature: Restore Workflow
  As an authorised editor
  I want to restore a snapshot to a permitted destination
  So that content can be recovered safely

  Background:
    Given I am an authorised editor reviewing a snapshot

  Scenario: See only destinations I am permitted to restore to
    When I begin a restore
    Then I am offered only the destinations my permissions allow
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/UserService.js
  # Evidence: controllers.Restore.restoreDestinations (GET /api/1/restore/destinations/:contentId)

  Scenario: Understand each destination before restoring
    When destinations are presented
    Then each one explains its current content state to help me choose
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js

  Scenario: Confirm safety checks before restoring
    When I have not confirmed the required safety checks
    Then I cannot submit the restore
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Complete a restore and return to the destination
    Given I have chosen a permitted destination and confirmed the safety checks
    When I submit the restore
    Then the snapshot is restored and I am taken to that destination's content
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: controllers.Restore.restore (POST /api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId)

  Scenario: Prevent restores the editor is not entitled to make
    When I attempt a restore I am not permitted to perform
    Then the restore is refused with an explanation of the missing permission
  # Evidence: controllers.Restore.restore (POST /api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId)
  # Evidence: app/permissions/Permissions.scala
