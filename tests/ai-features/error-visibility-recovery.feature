Feature: Error visibility and recovery
  As an editor using Restorer
  I want failures surfaced clearly and the UI left in a safe state
  So that I understand what happened and am not stuck in a broken flow

  Background:
    Given I am using the version review screen

  Scenario: The error panel stays hidden until something fails
    When no error has occurred
    Then the error panel is not shown
  # Evidence: public/javascripts/app/templates/restore-list.html (error modal ng-class visually-hidden / hasError)
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js (hasError defaults false)

  Scenario: A failure while confirming a restore returns me to a safe state
    Given the restore confirmation is open
    When an error occurs
    Then the restore confirmation is closed
    And the error message is shown
  # Evidence: public/javascripts/app/templates/restore-list.html (error modal, restore modal)
  # Evidence: public/javascripts/app/controllers/ModalController.js (mediator.subscribe('error', closeModal))
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js (error subscription sets hasError/errorContent)
