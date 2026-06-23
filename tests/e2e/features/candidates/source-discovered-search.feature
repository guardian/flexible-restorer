Feature: Source discovered Search capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-search
  Scenario: Search by composer url opens content versions page
    Given I am on the Restorer search page
    When I submit a composer url
    Then I should be navigated to the versions page for the parsed content id
    # Evidence:
    # - public/javascripts/app/templates/splash-screen.html
    # - public/javascripts/app/controllers/SearchFormCtrl.js
    # - conf/routes (/content/:contentId/versions)
