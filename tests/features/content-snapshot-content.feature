Feature: Review and act on snapshot content in version history
  This allows an editor to inspect HTML and JSON snapshot representations
  And to copy, export, and restore from the snapshot content panel

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the version history page for a piece of content

  Scenario: HTML content is shown by default in the content panel
    Given snapshot content has loaded
    When I view the content panel initially
    Then HTML content should be visible
    And the display toggle label should be Show JSON
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Snapshot furniture shows the headline, standfirst, and trail text
    Given snapshot content has loaded
    When I view the content panel furniture
    Then I should see the snapshot headline
    And I should see the snapshot standfirst
    And I should see the snapshot trail text
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: I can switch to JSON view and back to text view
    Given snapshot content has loaded
    When I use the display toggle to show JSON
    Then JSON content should be visible
    And the display toggle label should be Show TEXT
    When I use the display toggle again
    Then HTML content should be visible
    And the display toggle label should be Show JSON
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Right and left keyboard keys switch between JSON and HTML displays
    Given snapshot content has loaded
    And the restore modal is not open
    When I press the right arrow key
    Then JSON content should be displayed
    When I press the left arrow key
    Then HTML content should be displayed
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js

  Scenario: I can copy JSON content and receive feedback
    Given snapshot content has loaded
    And JSON content is available in the panel
    When I use the Copy JSON action
    Then the snapshot JSON should be copied to the clipboard
    And the copy button label should change to Copied!
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: JSON copy label resets when another snapshot is loaded
    Given I previously copied snapshot JSON
    When a different snapshot is loaded into the content panel
    Then the copy button label should reset to Copy JSON
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js

  Scenario: Export actions target the current content id
    Given snapshot content has loaded
    When I inspect snapshot content export actions
    Then I should see an export as Git Repo action for the current content id
    And I should see an export as Zip action for the current content id
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Restore action is shown only for users with restore permission
    Given the user permissions are loaded
    When the user has restore_content permission
    Then the Restore action should be visible in the snapshot content panel
    When the user does not have restore_content permission
    Then the Restore action should not be visible in the snapshot content panel
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Enter key opens the restore modal from snapshot content context
    Given snapshot content has loaded
    And the restore modal is not open
    When I press Enter
    Then the restore modal should be displayed
    And snapshot list keyboard navigation should be suspended while the modal is open
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Restore modal can be closed with Cancel or Escape
    Given the restore modal is open
    When I choose Cancel
    Then the restore modal should close
    And HTML display mode should be restored
    When I reopen the restore modal and press Escape
    Then the restore modal should close
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Restore destinations and source details are loaded when modal opens
    Given the restore modal is opened for an active snapshot
    When destination data is available
    Then I should see source revision and source timestamp details
    And I should see destination options filtered by permission rules
    And the current system destination should be pre-selected when present
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Restore confirmation requires both safety checkboxes
    Given the restore modal is open
    When either required safety checkbox is not selected
    Then the Restore Version action should be disabled
    When both required safety checkboxes are selected
    Then the Restore Version action should be enabled
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Successful restore redirects back to the selected Composer instance
    Given the restore modal is open
    And a destination is selected
    When I submit Restore Version successfully
    Then I should be redirected to that destination Composer content URL
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js

  Scenario: Error in snapshot content loading shows the error modal
    Given snapshot content loading fails
    When the error is published
    Then I should see the error modal with an explanatory message
    And the restore modal should close if it was open
  # Evidence: public/javascripts/app/controllers/SnapshotContentCtrl.js
  # Evidence: public/javascripts/app/controllers/ErrorCtrl.js
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: No restore destinations shows an error outcome
    Given the restore modal is open
    When there are no destinations available for the current content
    Then I should see an error outcome for missing restore destinations
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
