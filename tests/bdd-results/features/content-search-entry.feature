@content-search-entry
Feature: Content Search & Entry
  As an editor recovering Composer content
  I want to look up a piece of content's version history
  So that I can review or restore a previous snapshot

  Background:
    Given I am a signed-in editor on the search page

  Scenario: Find version history for a piece of content
    When I search for a piece of content by its Composer reference
    Then I am taken to that content's version history
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js
  # Evidence: public/javascripts/app/templates/splash-screen.html
  # Evidence: controllers.Application.versionIndex (GET /content/:contentId/versions)

  Scenario: Search is unavailable until I provide a reference
    When I have not entered a content reference
    Then I cannot start a search
  # Evidence: public/javascripts/app/templates/splash-screen.html

  Scenario Outline: The final reference segment identifies the content
    When I search using "<input>"
    Then version history is opened for "<contentId>"

    Examples:
      | input                                  | contentId   |
      | https://composer/content/abc123        | abc123      |
      | abc123                                 | abc123      |
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js
  # Evidence: controllers.Application.versionIndex (GET /content/:contentId/versions)
