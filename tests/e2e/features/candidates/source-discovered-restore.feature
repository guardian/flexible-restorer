Feature: Source discovered Restore capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-restore
  Scenario: Show restore action only to users with restore permission
    Given a user is viewing snapshot content
    When permissions are loaded
    Then the restore action should be visible only for users with restore permission
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js
    # - public/javascripts/app/controllers/RestoreFormCtrl.js
    # - public/javascripts/app/templates/restore-list.html

  @candidate @source-discovery @domain-restore
  Scenario: Close restore modal with escape key
    Given the restore modal is open
    When I press escape
    Then the modal should close and the page should return to normal scrolling
    # Evidence:
    # - public/javascripts/app/controllers/ModalController.js
