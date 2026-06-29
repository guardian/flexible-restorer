Feature: Track page visits and snapshot interactions
  This allows the app to send telemetry when pages change
  And to record key snapshot actions as analytics events

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth

  @pending
  Scenario Outline: The analytics service chooses the correct telemetry client for the current host
    Given the application has bootstrapped the analytics service
    When the app is running on <host>
    Then analytics requests should be sent to <telemetryClient>

    Examples:
      | host                             | telemetryClient                                   |
      | restorer.gutools.co.uk           | https://user-telemetry.gutools.co.uk              |
      | restorer.code.dev-gutools.co.uk  | https://user-telemetry.code.dev-gutools.co.uk     |
      | restorer.local.dev-gutools.co.uk | https://user-telemetry.local.dev-gutools.co.uk    |
  # Evidence: public/javascripts/app/services/AnalyticsService.js

  Scenario: A route change sends a tracking pixel for the current page path
    Given the analytics service is active
    When I navigate to a new page in the application
    Then a tracking pixel should be requested
    And the request should include app=restorer
    And the request should include the current route path
  # Evidence: public/javascripts/app/services/AnalyticsService.js
  # Evidence: public/javascripts/app/main.js
