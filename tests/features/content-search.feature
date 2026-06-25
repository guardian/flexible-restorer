@content-search 
Feature: Find content version history from the splash screen
  This allows an editor to check who made changes
  Or to restore a specific snapshot of Composer content

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth

  Scenario: An editor can find version history from a valid Composer URL
    Given I am an editor recovering and reviewing content
    And I am using the splash screen search page
    When I submit a valid Content API URL in the search form
    Then I should see the content version history for that Content API URL
  # Evidence: public/javascripts/app/templates/splash-screen.html
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js
  
  Scenario: An editor can find version history by entering only a content id
    Given I am an editor recovering and reviewing content
    And I am using the splash screen search page
    When I submit a content id value in the search form
    Then I should be taken to the version history route for that content id
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js

  Scenario: Search cannot be submitted while the query is empty
    Given I am an editor recovering and reviewing content
    And I am using the splash screen search page
    When the query input is empty
    Then the Search button should be disabled
    And the form should require a query value
  # Evidence: public/javascripts/app/templates/splash-screen.html

  Scenario: A trailing slash in the submitted URL produces an empty hash segment
    Given I am an editor recovering and reviewing content
    And I am using the splash screen search page
    When I submit a URL that ends with a trailing slash
    Then navigation should be built from the final path segment
    And the resulting version history route can contain an empty content id segment
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js

  Scenario: An editor sees an error when no snapshots exist for the searched content
    Given I am an editor recovering and reviewing content
    And I am using the splash screen search page
    When I submit a content id that has no snapshots
    Then I should be taken to the version history route for that content id
    And I should see an error message that no snapshots are available for that piece of content
  # Evidence: public/javascripts/app/controllers/SearchFormCtrl.js
  # Evidence: public/javascripts/app/collections/SnapshotIdModels.js
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

