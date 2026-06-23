Feature: Source discovered Export capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-export
  Scenario: Export snapshots as Git repository
    Given I am viewing a content id in Restorer
    When I choose export as Git repo
    Then the app should return a Git export for that content id
    # Evidence:
    # - conf/routes (GET /export/:contentId/git)
    # - public/javascripts/app/templates/restore-list.html

  @candidate @source-discovery @domain-export
  Scenario: Export snapshots as zip archive
    Given I am viewing a content id in Restorer
    When I choose export as zip
    Then the app should return a zip export for that content id
    # Evidence:
    # - conf/routes (GET /export/:contentId/zip)
    # - public/javascripts/app/templates/restore-list.html
