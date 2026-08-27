Feature: Track page visits and snapshot interactions
  This allows the app to send telemetry when pages change
  And to record key snapshot actions as analytics events

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth

  Scenario: A route change sends a tracking pixel for the current page path
    Given the analytics service is active
    When I navigate to a new page in the application
    Then a tracking pixel should be requested
    And the request should include app=restorer
    And the request should include the current route path
  # Evidence: public/javascripts/app/services/AnalyticsService.js
  # Evidence: public/javascripts/app/main.js
