@operations-health
Feature: Operations & Health
  As an operator running the service
  I want health and system information endpoints
  So that I can monitor availability and inspect configuration

  Scenario: Check service availability without signing in
    When I check the service health
    Then I receive a healthy response without needing to authenticate
  # Evidence: controllers.Management.healthCheck (GET /management/healthcheck)

  Scenario: Inspect system information as an authorised user
    Given I am an authorised user
    When I request system information
    Then I can see host and stack configuration details
  # Evidence: controllers.Management.info (GET /management/info)
