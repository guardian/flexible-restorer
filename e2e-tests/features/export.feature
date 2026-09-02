Feature: Export snapshot history for external use
  This allows the app to download version history as a zip archive
  And to package snapshot history as a git repository export

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth

  Scenario: Exporting as a zip returns snapshot files for the requested content
    Given version history exists for a piece of content
    When I request the zip export for that content
    Then I should receive a downloadable zip archive
    And the archive should contain live, preview, and metadata files for each snapshot
  # Evidence: app/controllers/Export.scala#L44-L68 (exportAsZip writes live/preview/metadata)
  # Evidence: conf/routes#L29 (export zip route)

  Scenario: Exporting content with no snapshots returns not found
    Given a piece of content has no snapshots
    When I request either export format for that content
    Then the response should be not found
    And the response should explain that the content has no snapshots
  # Evidence: app/controllers/Export.scala#L50-L51 & #L75-L76 (NotFound when no snapshots)
  # Evidence: conf/routes#L28-L29 (export git & zip routes)
