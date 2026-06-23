Feature: Source discovered Version List capabilities
  # Auto-generated from source analysis only.
  # These are candidate BDD scenarios and should be validated in a live environment.

  @candidate @source-discovery @domain-version-list
  Scenario: View available snapshot versions for a content id
    Given I am on a content versions page
    When snapshot data is loaded
    Then I should see a sidebar list of available snapshot versions
    # Evidence:
    # - conf/routes (/api/1/versionList/:contentId)
    # - public/javascripts/app/controllers/SnapshotListCtrl.js
    # - public/javascripts/app/templates/restore-list.html

  @candidate @source-discovery @domain-version-list
  Scenario: Sidebar loading state is shown until snapshot list is ready
    Given I have opened a content versions page
    When the snapshot list request is still in progress
    Then loading bars should be visible
    And the content layout should be hidden until loading completes
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListCtrl.js (isLoading true by default)
    # - public/javascripts/app/templates/restore-list.html (ng-if isLoading and !isLoading blocks)

  @candidate @source-discovery @domain-version-list
  Scenario: Snapshot list is sorted newest first by created date
    Given the snapshot service returns multiple versions
    When the collection is constructed
    Then snapshots should be ordered by created date descending
    # Evidence:
    # - public/javascripts/app/collections/SnapshotIdModels.js (comparator sorts newest first)

  @candidate @source-discovery @domain-version-list
  Scenario: First snapshot is active by default after list load
    Given the snapshot list has loaded successfully
    When the sidebar is first rendered
    Then the first model in the list should have active state
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListCtrl.js (getModelAt(0).set('activeState', true))

  @candidate @source-discovery @domain-version-list
  Scenario: Header metadata comes from the active snapshot
    Given the snapshot list has loaded successfully
    When the first snapshot is activated
    Then article title should show the active snapshot headline
    And article hash should show the active snapshot content id
    And article link should point to the active snapshot composer url
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListCtrl.js (articleTitle/articleHash/articleURL assignment)
    # - public/javascripts/app/models/SnapshotIdModel.js (getHeadline/getContentId/getComposerUrl)

  @candidate @source-discovery @domain-version-list
  Scenario: Sidebar activation animation occurs after load
    Given the snapshot list has loaded successfully
    When 500 milliseconds have elapsed
    Then the sidebar should transition to active state
    # Evidence:
    # - public/javascripts/app/controllers/SnapshotListCtrl.js ($timeout sets isSidebarActive)

  @candidate @source-discovery @domain-version-list
  Scenario: Secondary-system snapshots show a source banner row
    Given a snapshot model belongs to a secondary system
    When that model is rendered in the list
    Then a row should indicate the snapshot came from composer-secondary
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (isSecondary)
    # - public/javascripts/app/templates/restore-list.html (snapshot-list-secondary row)

  @candidate @source-discovery @domain-version-list @edge-case
  Scenario: Revision index falls back when revision id is missing
    Given a snapshot has no revision id in content change details
    When the row index is rendered
    Then the row should display fallback numbering based on list position
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (getRevisionId)
    # - public/javascripts/app/templates/restore-list.html (revision id fallback to models.length - $index)

  @candidate @source-discovery @domain-version-list
  Scenario: Relative time and editor metadata are shown for each row
    Given the snapshot list is displayed
    When each row is rendered
    Then it should show relative age text and last modified user
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (getRelativeDate/getUserEmail)
    # - public/javascripts/app/templates/restore-list.html (relative-date and last modified fields)

  @candidate @source-discovery @domain-version-list
  Scenario: Launch-related snapshots are visually highlighted
    Given a snapshot reason is Published or contains launch
    When that row is rendered
    Then launch highlight classes should be applied to row and reason text
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (isBecauseOfLaunch)
    # - public/javascripts/app/templates/restore-list.html (highlight-row-for-launches and highlight-reason-for-launches)

  @candidate @source-discovery @domain-version-list
  Scenario: Content settings indicators are conditionally rendered
    Given snapshot settings include legally sensitive and commentable states
    When the row status is displayed
    Then legal sensitivity and comments on or off indicators should reflect those settings
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (isLegallySensitive/commentsEnabled)
    # - public/javascripts/app/templates/restore-list.html (status indicator ng-show conditions)

  @candidate @source-discovery @domain-version-list
  Scenario: Published state label reflects lifecycle conditions
    Given a snapshot may be scheduled, embargoed, published, or taken down
    When published state is evaluated
    Then the status label should display the matching state text
    # Evidence:
    # - public/javascripts/app/models/SnapshotIdModel.js (getPublishedState)
    # - public/javascripts/app/templates/restore-list.html (published state output)

  @candidate @source-discovery @domain-version-list @edge-case
  Scenario: No-snapshot response produces a user-facing error flow
    Given the version list endpoint returns an empty array
    When the snapshot id collection is built
    Then the request should reject with a no snapshots error
    And the controller should publish an error event and stop loading
    # Evidence:
    # - public/javascripts/app/collections/SnapshotIdModels.js (reject on empty list)
    # - public/javascripts/app/controllers/SnapshotListCtrl.js (catch sets isLoading false and publishes error)

  @candidate @source-discovery @domain-version-list @edge-case
  Scenario: Upstream list request failure enters error flow
    Given the version list endpoint request fails
    When collection loading rejects
    Then the list controller should stop loading and publish an error event
    # Evidence:
    # - public/javascripts/app/collections/SnapshotIdModels.js (SnapshotService.getList catch reject)
    # - public/javascripts/app/controllers/SnapshotListCtrl.js (catch block)
