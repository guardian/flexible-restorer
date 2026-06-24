@export
Feature: Export
  As an editor needing content history outside the tool
  I want to download a content's snapshots
  So that I can archive or share its history

  Background:
    Given I am a signed-in editor viewing a content's snapshots

  Scenario: Download snapshot history as an archive
    When I export the content's history as a zip
    Then I receive a downloadable archive of its snapshots
  # Evidence: public/javascripts/app/templates/restore-list.html
  # Evidence: controllers.Export.exportAsZip (GET /export/:contentId/zip)

  Scenario: Download snapshot history as a versioned repository
    When I export the content's history as a git repository
    Then I receive a downloadable repository capturing each snapshot version
  # Evidence: public/javascripts/app/templates/restore-list.html
  # Evidence: controllers.Export.exportAsGitRepo (GET /export/:contentId/git)

  Scenario: Explain when there is nothing to export
    When I export a content that has no snapshots
    Then I am told that no snapshots exist for that content
  # Evidence: controllers.Export.exportAsZip (GET /export/:contentId/zip)
  # Evidence: controllers.Export.exportAsGitRepo (GET /export/:contentId/git)
