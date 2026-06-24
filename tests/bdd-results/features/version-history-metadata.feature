@version-history-metadata
Feature: Version History & Snapshot Metadata
  As an editor reviewing a piece of content
  I want to see the available snapshots and their details
  So that I can choose the right version to inspect or restore

  Background:
    Given I am viewing the version history for a piece of content

  Scenario: Review the list of available snapshots
    When the version history has loaded
    Then I see each snapshot with its revision, timing, editor, and status
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js
  # Evidence: public/javascripts/app/models/SnapshotIdModel.js
  # Evidence: controllers.Versions.versionList (GET /api/1/versionList/:contentId)

  Scenario: Understand how many versions exist
    When version availability is reported
    Then I can see the total number of snapshots for the content
  # Evidence: controllers.Versions.availableVersionsCount (GET /api/1/version-count/:contentId)

  Scenario: Recognise snapshots that need special attention
    When a snapshot carries a notable condition
    Then it is clearly indicated in the list
    And conditions such as secondary source, launch, legal sensitivity, and comment settings are distinguishable
  # Evidence: public/javascripts/app/models/SnapshotIdModel.js
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js

  Scenario: Tell the editor when no snapshots exist
    When the content has no snapshots available
    Then I am told that no snapshots are available for that content
  # Evidence: public/javascripts/app/collections/SnapshotIdModels.js
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js
