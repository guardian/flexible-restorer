Feature: Track page visits and snapshot interactions
  This allows the app to send telemetry when pages change
  And to record key snapshot actions as analytics events

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth

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

  Scenario: Loading the app boots analytics tracking automatically
    Given the application has started
    When the restorer application run block executes
    Then analytics tracking should be available without extra user action
    And subsequent route changes should be tracked
  # Evidence: public/javascripts/app/main.js
  # Evidence: public/javascripts/app/services/AnalyticsService.js

  Scenario: Viewing a snapshot emits a viewed analytics event
    Given version history data has loaded successfully
    When the first snapshot content is loaded
    Then a Snapshot Viewed event should be published
    And the event should include the content id and snapshot timestamp
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/services/AnalyticsService.js

  Scenario: Changing the active snapshot emits an active analytics event
    Given version history data has loaded successfully
    When I move to a different snapshot in the list
    Then a Snapshot Active event should be published
    And the event should include the content id and snapshot timestamp
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js
  # Evidence: public/javascripts/app/services/AnalyticsService.js

  Scenario: Copying snapshot content emits a copied analytics event
    Given snapshot content has loaded
    When I copy the snapshot JSON
    Then a Snapshot Copied event should be published
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/services/AnalyticsService.js

  Scenario: Restoring a snapshot emits a restored analytics event
    Given the restore modal is open
    When I submit a successful restore
    Then a Snapshot Restored event should be published
    And the event should include the content id and snapshot timestamp
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/AnalyticsService.js
