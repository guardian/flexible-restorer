Feature: Source discovered Version Navigation capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-version-navigation
  Scenario: Select a snapshot version to load it into the main pane
    Given I am viewing snapshot versions
    When I click a snapshot row
    Then the selected snapshot should become active and its content should load in the main pane
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
    # - public/javascripts/app/controllers/SnapshotListCtrl.js
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js

  @candidate @source-discovery @domain-version-navigation
  Scenario: Navigate snapshot versions with keyboard
    Given I am focused on the versions view
    When I use up/down arrow keys and press enter
    Then the active snapshot should change and modal interaction should be available
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListInteractionCtrl.js (keydown handler)
