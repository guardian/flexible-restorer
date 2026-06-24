@error-handling
Feature: Error Handling
  As an editor using the tool
  I want clear feedback when something goes wrong
  So that I understand the problem and can recover

  Background:
    Given I am using the version review screen

  Scenario: Surface a clear message when something fails
    When an operation fails
    Then I am shown a clear error message describing what went wrong
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js
  # Evidence: public/javascripts/app/utils/mediator.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Keep error feedback hidden until it is needed
    When no error has occurred
    Then no error message is shown
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js

  Scenario: Return to a safe state when a restore is interrupted by an error
    Given I am confirming a restore
    When an error interrupts the flow
    Then the confirmation is closed and the error is surfaced
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js
