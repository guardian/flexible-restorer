# @mode:serial pins this feature to a single worker and runs its scenarios in
# order. Several scenarios are @state-modifying: they mutate the shared mock
# flexible-content API's global state and reset it afterwards, so they must not
# overlap with each other across parallel workers. Serialising the feature keeps
# them safe in any setup (including --repeat-each / high --workers) while every
# other feature still runs in parallel.
@mode:serial
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
  # Evidence: public/javascripts/app/templates/restore-list.html#L225-L243 (Before you restore, From/To, source summary)
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L54-L58 (sets source revision/system/date)
  # Evidence: public/javascripts/app/controllers/ModalController.js#L20-L28 (showModal)

  Scenario: The restore modal shows the source as coming from secondary when appropriate
    Given the active snapshot is from a secondary system
    When I open the restore modal
    Then I should see the source summary indicate that it is from secondary
  # Evidence: public/javascripts/app/templates/restore-list.html#L240-L243 (source "from secondary" summary)
  # Evidence: public/javascripts/app/models/SnapshotIdModel.js#L40-L46 (getSystem / isSecondary)
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L56 (snapshotSystem = model.getSystem())

  Scenario: Destination choices are limited when I cannot restore to any stack
    Given I do not have restore_content_to_any_stack permission
    When the restore modal loads destination choices
    Then I should only see destinations for the current system
    And I should not see destinations from other stacks
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L40-L44 & #L64-L78 (permission read & destination filter)
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination list)

  Scenario: Destination choices include all available stacks when I have permission
    Given I have restore_content_to_any_stack permission
    When the restore modal loads destination choices
    Then I should see every available restore destination
    And the destination list should not be restricted to the current system
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L40-L44 & #L64-L67 (canRestoreToAnyStack keeps all)
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination list)

  @state-modifying
  Scenario: A destination row shows a revision summary when it already has content
    Given the restore modal has loaded destination choices when the destination already has content
    When I inspect the destination list
    Then I should see a revision summary that already has content
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L69-L72 (changeString with revision summary)
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination changeString display)
    

  @state-modifying
  Scenario: A destination row shows content not on this instance when it has no content
    Given the restore modal has loaded destination choices when the destination has no content
    When I inspect the destination list
    And I should see "content not on this instance" 
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L73-L74 (changeString "content not on this instance")
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination changeString display)

  @state-modifying
  Scenario: A destination row shows no extra message when it cannot be used
    Given the restore modal has loaded destination choices when the destination cannot be used
    When I inspect the destination list
    And I should see no extra message when the destination cannot be used
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L75-L77 (empty changeString when unusable)
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination changeString display)

  @state-modifying
  Scenario: A destination is marked unavailable when its stack cannot be reached
    Given one destination stack does not respond within the timeout
    When the restore modal loads destination choices for that content
    Then that destination should be returned as unavailable
    And its selection option should be disabled in the destination list
  # Evidence: app/controllers/Restore.scala#L52-L73 (restoreDestinations marks unavailable on failure)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (ng-disabled on !dest.available)

  Scenario: The current destination is preselected when it is available
    Given the restore modal has loaded destination choices with current system present
    When the modal finishes loading
    Then the current system destination should be preselected
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L60-L62 (preselect current or first)
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination list)

  Scenario: The first available destination is used when the current system is missing
    Given the restore modal has loaded destination choices with current system missing
    When the modal finishes loading
    Then the first destination should be preselected
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L60-L62 (falls back to destinations[0])
  # Evidence: public/javascripts/app/services/RestoreService.js#L38-L49 (getDestinations)
  # Evidence: public/javascripts/app/templates/restore-list.html#L246-L262 (destination list)

  Scenario: The Restore Version action stays disabled until both safety checks are confirmed
    Given the restore modal is open
    When either safety checkbox is not selected
    Then the Restore Version action should be disabled
    When both safety checkboxes are selected
    Then the Restore Version action should be enabled
  # Evidence: public/javascripts/app/templates/restore-list.html#L272-L299 (safety checkboxes & submit ng-disabled)

  Scenario: Closing the modal resets the restore form back to its initial state
    Given the restore modal is open 
    And I choose a destination and select the safety checkboxes
    When I close the modal with Cancel
    Then the modal should close
    And the restore modal is open
    And the destination list should be cleared
    And the safety checkboxes should reset
  # Evidence: public/javascripts/app/controllers/ModalController.js#L30-L37 (closeModal publishes hidden-modal)
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L91-L99 (resetModalForm)
  # Evidence: public/javascripts/app/templates/restore-list.html#L300-L303 (Cancel type=reset)

  Scenario: Pressing Escape closes the restore modal
    Given the restore modal is open
    When I press Escape
    Then the modal should close
    And the page should return to the version history view
  # Evidence: public/javascripts/app/controllers/ModalController.js#L46-L51 (keydown Escape closes modal)
  # Evidence: public/javascripts/app/templates/restore-list.html#L211-L216 (modal container)

  Scenario: A successful restore returns me to Composer for that content
    Given the restore modal is open
    And a destination is selected
    When I submit Restore Version successfully
    Then I should be redirected to that destination Composer content URL
    And I should land on the same content id in that Composer instance
  # Evidence: public/javascripts/app/controllers/RestoreFormCtrl.js#L18-L28 (restore then redirect to Composer)
  # Evidence: public/javascripts/app/services/RestoreService.js#L14-L37 (restore POST request)
  # Evidence: public/javascripts/app/templates/restore-list.html#L217 (ng-submit formCtrl.restore)

  Scenario: A restore request is rejected when I lack restore_content permission
    Given I do not have restore_content permission
    When I submit a restore request to the restore API
    Then the request should be rejected as forbidden
    And I should be told that the restore_content permission is required
  # Evidence: app/controllers/Restore.scala#L33-L34 (Forbidden without RestoreContent)
  # Evidence: app/permissions/Permissions.scala#L9 (RestoreContent)

  Scenario: Restoring to a different stack is rejected without cross-stack permission
    Given I have restore_content permission
    And I do not have restore_content_to_any_stack permission
    When I submit a restore request whose destination stack differs from the source stack
    Then the request should be rejected as forbidden
    And I should be told that the restore_content_to_any_stack permission is required
  # Evidence: app/controllers/Restore.scala#L35-L36 (Forbidden for cross-stack restore)
  # Evidence: app/permissions/Permissions.scala#L11 (RestoreContentToAlternateStack)

  Scenario: Restoring a snapshot that is missing from the source returns not found
    Given I have the required restore permissions
    When I submit a restore request for a snapshot that no longer exists in the source stack
    Then the response should be not found
  # Evidence: app/controllers/Restore.scala#L43-L44 (None snapshot returns NotFound)
