Feature: Source discovered Content View capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-content-view
  Scenario: Default view shows text content for the latest snapshot
    Given I open a content versions page with at least one snapshot
    When the initial snapshot content is loaded
    Then the content pane should default to text mode
    And the display toggle should read "Show JSON"
    And the copy button should read "Copy JSON"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (initial scope state and initial getCollection/getModelAt(0) load)
    # - public/javascripts/app/templates/restore-list.html (displayButtonLabel and copyButtonLabel binding)

  @candidate @source-discovery @domain-content-view
  Scenario: Furniture fields are populated from the loaded snapshot model
    Given snapshot content has been loaded
    When the content view is rendered
    Then the headline, standfirst, and trail text fields should be shown from the snapshot model
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (headline, standfirst, trailText assignments)
    # - public/javascripts/app/templates/restore-list.html (Headline/Standfirst/TrailText sections)

  @candidate @source-discovery @domain-content-view
  Scenario: Toggling to JSON mode updates the content pane and action label
    Given I am viewing text content in the content pane
    When I click the display toggle button
    Then the JSON pane should be shown
    And the display toggle should read "Show TEXT"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (toggleJSON and displayJSON)
    # - public/javascripts/app/templates/restore-list.html (show-json class and displayButtonLabel binding)

  @candidate @source-discovery @domain-content-view
  Scenario: Toggling back to text mode resets the display label
    Given I am viewing JSON in the content pane
    When I click the display toggle button
    Then the text pane should be shown
    And the display toggle should read "Show JSON"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (toggleJSON and displayHTML)

  @candidate @source-discovery @domain-content-view
  Scenario: Copy snapshot JSON to clipboard
    Given I am viewing snapshot JSON
    When I click the copy JSON action
    Then the snapshot JSON should be copied to the clipboard
    And the copy button should change to "Copied!"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (copyJSON)

  @candidate @source-discovery @domain-content-view
  Scenario: Copy label resets after loading a different snapshot
    Given I have copied JSON and the button reads "Copied!"
    When I load a different snapshot version
    Then the copy button should reset to "Copy JSON"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (displayContent resets copyButtonLabel)

  @candidate @source-discovery @domain-content-view
  Scenario: Content view returns to text mode after restore modal closes
    Given I switched the content pane to JSON mode
    When the restore modal is closed
    Then the content pane should return to text mode
    And the display toggle should read "Show JSON"
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (snapshot-list:hidden-modal subscription)

  @candidate @source-discovery @domain-content-view @edge-case
  Scenario: Initial snapshot list load failure triggers an error event
    Given I open a content versions page
    When loading the snapshot id collection fails
    Then an error event should be published for global error handling
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (getCollection catch publishes mediator error)

  @candidate @source-discovery @domain-content-view @edge-case
  Scenario: Snapshot content fetch failure triggers an error event
    Given I request content for a specific snapshot version
    When fetching that snapshot fails
    Then an error event should be published for global error handling
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotContentCtrl.js (getSnapshot catch publishes mediator error)
