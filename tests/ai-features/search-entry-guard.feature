Feature: Search entry guard
  As an editor looking up content history
  I want the search to require a value before it can run
  So that I cannot trigger an empty, meaningless search

  Background:
    Given I am on the splash screen search page

  Scenario: Search cannot be run until I enter a composer url
    When the composer url field is empty
    Then the Search action cannot be submitted
  # Evidence: public/javascripts/app/templates/splash-screen.html (ng-required, ng-disabled !search.query)
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js (formSubmit consumes search.query)
