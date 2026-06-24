@snapshot-content-viewing
Feature: Snapshot Content Viewing
  As an editor inspecting a snapshot
  I want to read its content in a readable form
  So that I can confirm what the version contained

  Background:
    Given I am viewing a snapshot's content

  Scenario: Review the snapshot's article content
    When the snapshot content has loaded
    Then I can read its headline, standfirst, trail text, and body
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/models/SnapshotModel.js
  # Evidence: controllers.Versions.show (GET /api/1/version/:systemId/:contentId/:timestamp)

  Scenario: Switch between readable and raw representations
    When I switch the content view
    Then I can move between the readable article and its raw JSON
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js

  Scenario: Take a copy of the snapshot data
    When I copy the snapshot content
    Then I receive confirmation that the content was copied
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
