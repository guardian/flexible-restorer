Feature: Restore a selected snapshot from the restore modal
  This allows an editor to review the from and to choices
  And to confirm a safe restore from the version history page

  Background:
    Given the application stack is running
    And I am signed in through pan-domain auth
    And I have opened the version history page for a piece of content

  Scenario: The restore modal shows the source snapshot header and destination headings
    Given a snapshot is active in the version history page
    When I open the restore modal
    Then I should see the "Before you restore" heading
    And I should see the "From" and "To" headings
    And I should see source revision and source timestamp details
  # Evidence: public/javascripts/app/templates/restore-list.html
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/controllers/ModalController.js

  Scenario: The restore modal shows the source as coming from secondary when appropriate
    Given the active snapshot is from a secondary system
    When I open the restore modal
    Then I should see the source summary indicate that it is from secondary
  # Evidence: public/javascripts/app/templates/restore-list.html
  # Evidence: public/javascripts/app/models/SnapshotIdModel.js
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js

  Scenario: Destination choices are limited when I cannot restore to any stack
    Given I do not have restore_content_to_any_stack permission
    When the restore modal loads destination choices
    Then I should only see destinations for the current system
    And I should not see destinations from other stacks
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: Destination choices include all available stacks when I have permission
    Given I have restore_content_to_any_stack permission
    When the restore modal loads destination choices
    Then I should see every available restore destination
    And the destination list should not be restricted to the current system
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: Each destination row explains whether content is already present or available
    Given the restore modal has loaded destination choices
    When I inspect the destination list
    Then I should see a revision summary when the destination already has content
    And I should see "content not on this instance" when the destination is available but empty
    And I should see no extra message when the destination cannot be used
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: A destination is marked unavailable when its stack cannot be reached
    Given the restore modal loads destination choices
    When a destination stack does not respond within the timeout
    Then that destination should be returned as unavailable
    And its selection option should be disabled in the destination list
  # Evidence: app/controllers/Restore.scala
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: The current destination is preselected when it is available
    Given the restore modal has loaded destination choices
    And the current system is present in the destination list
    When the modal finishes loading
    Then the current system destination should be preselected
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: The first available destination is used when the current system is missing
    Given the restore modal has loaded destination choices
    And the current system is not present in the destination list
    When the modal finishes loading
    Then the first destination should be preselected
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: The Restore Version action stays disabled until both safety checks are confirmed
    Given the restore modal is open
    When either safety checkbox is not selected
    Then the Restore Version action should be disabled
    When both safety checkboxes are selected
    Then the Restore Version action should be enabled
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: Closing the modal resets the restore form back to its initial state
    Given the restore modal is open
    When I close the modal with Cancel
    Then the modal should close
    And the destination list should be cleared
    And the safety checkboxes should reset
    And the source summary should be cleared
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: Pressing Escape closes the restore modal
    Given the restore modal is open
    When I press Escape
    Then the modal should close
    And the page should return to the version history view
  # Evidence: public/javascripts/app/controllers/ModalController.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  @pending
  Scenario: A successful restore returns me to Composer for that content
    Given the restore modal is open
    And I have selected a destination
    When I submit Restore Version successfully
    Then I should be redirected to the selected Composer content URL
    And I should land on the same content id in that Composer instance
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js
  # Evidence: public/javascripts/app/services/RestoreService.js
  # Evidence: public/javascripts/app/templates/restore-list.html

  Scenario: A restore request is rejected when I lack restore_content permission
    Given I do not have restore_content permission
    When I submit a restore request to the restore API
    Then the request should be rejected as forbidden
    And I should be told that the restore_content permission is required
  # Evidence: app/controllers/Restore.scala
  # Evidence: app/permissions/Permissions.scala

  Scenario: Restoring to a different stack is rejected without cross-stack permission
    Given I have restore_content permission
    And I do not have restore_content_to_any_stack permission
    When I submit a restore request whose destination stack differs from the source stack
    Then the request should be rejected as forbidden
    And I should be told that the restore_content_to_any_stack permission is required
  # Evidence: app/controllers/Restore.scala
  # Evidence: app/permissions/Permissions.scala

  @pending
  Scenario: Restoring a snapshot that is missing from the source returns not found
    Given I have the required restore permissions
    When I submit a restore request for a snapshot that no longer exists in the source stack
    Then the response should be not found
  # Evidence: app/controllers/Restore.scala
