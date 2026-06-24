@snapshot-interaction-navigation
Feature: Snapshot Interaction & Navigation
  As an editor moving through version history
  I want efficient navigation and a focused confirmation flow
  So that I can move between snapshots and act without mistakes

  Background:
    Given I am viewing the version history for a piece of content

  Scenario: Move through snapshots without leaving the keyboard
    When I navigate between snapshots using the keyboard
    Then the selected snapshot updates and its content is shown
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js

  Scenario: Open the restore confirmation as a focused step
    When I begin a restore from the current snapshot
    Then a focused confirmation appears
    And the page behind it stays fixed while I decide
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js

  Scenario: Suspend list navigation while confirming
    Given the restore confirmation is open
    When I use navigation keys
    Then snapshot navigation is suspended until I close the confirmation
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/controllers/ModalController.js

  Scenario: Leave the confirmation quickly
    Given the restore confirmation is open
    When I dismiss it
    Then I return to the version view in its default reading state
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
