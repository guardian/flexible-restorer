@analytics-telemetry
Feature: Analytics & Telemetry
  As the product team
  I want to record page visits and key snapshot actions
  So that we understand how the tool is used

  Scenario: Record that a page was visited
    Given analytics is active for the session
    When I move to a new page in the application
    Then that page visit is recorded
  # Evidence: public/javascripts/app/services/AnalyticsService.js
  # Evidence: public/javascripts/app/main.js

  Scenario Outline: Record meaningful snapshot actions
    Given analytics is active for the session
    When I "<action>" a snapshot
    Then a "<event>" event is recorded

    Examples:
      | action  | event    |
      | view    | Viewed   |
      | select  | Active   |
      | copy    | Copied   |
      | restore | Restored |
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
