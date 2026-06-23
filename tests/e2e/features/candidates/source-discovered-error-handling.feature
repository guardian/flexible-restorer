Feature: Source discovered Error Handling capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-error-handling
  Scenario: Display error state when snapshot or restore operations fail
    Given an operation fails in the app
    When an error event is published
    Then an error modal should be shown with the error message
    # Evidence:
    # - public/javascripts/app/controllers/ErrorCtrl.js
    # - public/javascripts/app/templates/restore-list.html (error modal)
