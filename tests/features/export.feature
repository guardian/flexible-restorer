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
  # Evidence: app/controllers/Export.scala
  # Evidence: conf/routes

  @pending
  Scenario: Exporting as a git repository returns committed snapshot history
    Given version history exists for a piece of content
    When I request the git export for that content
    Then I should receive a downloadable zip archive of a git repository
    And the repository should contain committed snapshot files for each version
    And each commit should be labeled with the snapshot timestamp
  # Evidence: app/controllers/Export.scala
  # Evidence: conf/routes

  @pending
  Scenario: Exporting content with no snapshots returns not found
    Given a piece of content has no snapshots
    When I request either export format for that content
    Then the response should be not found
    And the response should explain that the content has no snapshots
  # Evidence: app/controllers/Export.scala
  # Evidence: conf/routes

  @pending
  Scenario: Export routes are protected by the same auth gate as the rest of the app
    Given I am not signed in
    When I request an export route
    Then I should be redirected to the access denied page
  # Evidence: app/auth/PanDomainAuthActions.scala
  # Evidence: app/controllers/Export.scala
  # Evidence: conf/routes