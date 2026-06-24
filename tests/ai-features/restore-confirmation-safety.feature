Feature: Restore confirmation safety
  As an editor restoring Composer content
  I want the restore confirmation to guard against mistakes
  So that I only restore deliberately and to an allowed destination

  Background:
    Given I am an editor viewing a snapshot I am permitted to restore

  Scenario: The restore confirmation stays hidden until I start a restore
    When I have not started a restore
    Then the restore confirmation is not shown
  # Evidence: public/javascripts/app/templates/restore-list.html (modal ng-class visually-hidden / isActive)
  # Evidence: public/javascripts/app/controllers/ModalController.js (isActive defaults false)

  Scenario: Opening the restore confirmation locks the page behind it
    When I open the restore confirmation
    Then the page behind it cannot be scrolled
    And cancelling the confirmation restores normal page scrolling
  # Evidence: public/javascripts/app/templates/restore-list.html (modal, Cancel reset closeModal)
  # Evidence: public/javascripts/app/controllers/ModalController.js (overflow hidden on open, visible on close)

  Scenario: I am offered only destinations I am permitted to restore to
    When the restore confirmation opens
    Then I see only the destinations my permissions allow
    And each destination explains its current content state
    And a destination that is unavailable cannot be selected
  # Evidence: public/javascripts/app/templates/restore-list.html (destinations radio list, ng-disabled !dest.available)
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js (canRestoreToAnyStack filter, changeString)
  # Evidence: conf/routes (GET /api/1/restore/destinations/:contentId)

  Scenario: I cannot submit a restore until I confirm the safety checks
    Given the restore confirmation is open
    When the safety confirmations are not both checked
    Then the Restore Version action cannot be submitted
  # Evidence: public/javascripts/app/templates/restore-list.html (ng-disabled !selfInContent || !elseInContent)

  Scenario: Cancelling clears my safety confirmations for the next restore
    Given I have ticked the safety confirmations
    When I cancel the restore confirmation
    Then the safety confirmations are cleared the next time it opens
  # Evidence: public/javascripts/app/templates/restore-list.html (Cancel reset, checkbox bindings)
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js (resetModalForm clears selfInContent/elseInContent)
