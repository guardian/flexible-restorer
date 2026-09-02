Feature: Review snapshot list and metadata in version history
	This allows an editor to understand version ordering, status, and change context
	Before choosing a snapshot to inspect or restore

	Background:
		Given the application stack is running
		And I am signed in through pan-domain auth
		And I have opened the version history page for a piece of content

	Scenario: The snapshot list header shows the expected columns and content identity
		Given version history data has loaded successfully
		When I view the fixed snapshot list header
		Then I should see the article headline
		And I should see the article hash as a link to Composer
		And I should see the list column labels for revision number, snapshot timing, and status
	# Evidence: public/javascripts/app/templates/restore-list.html#L34-L47 (fixed header: headline, hash link, columns)
	# Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js#L27-L31 (articleTitle/articleHash/articleURL)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L48-L66 (getComposerUrl/getContentId/getHeadline)

	Scenario: The snapshot list is hidden until loading finishes
		Given version history data is still loading
		When I view the page
		Then I should see loading bars
		And I should not yet see the snapshot list content area
	# Evidence: public/javascripts/app/templates/restore-list.html#L22-L27 (loading bars vs content ng-if)
	# Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js#L17-L24 (isLoading toggled after load)

	Scenario: The sidebar becomes active after initial snapshot data is ready
		Given version history data has loaded successfully
		When the first snapshot is set active
		Then the sidebar should animate into an active state
		And the list should render with snapshot rows
	# Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js#L19-L34 (collection load & isSidebarActive)
	# Evidence: public/javascripts/app/templates/restore-list.html#L26-L31 (sidebar ng-class active)

	Scenario: A secondary-system snapshot displays a secondary source notice
		Given version history data contains a snapshot from composer-secondary
		When I view the list row for that snapshot
		Then I should see a notice that the snapshot came from composer-secondary
	# Evidence: public/javascripts/app/templates/restore-list.html#L54-L57 (secondary source notice)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L44-L46 (isSecondary)

	Scenario: Revision index falls back to list position when revision id is missing
		Given version history data contains a snapshot without an explicit revision id
		When I view the index value for that row
		Then I should see the fallback revision number based on list position
	# Evidence: public/javascripts/app/templates/restore-list.html#L66 (getRevisionId() || models.length - $index)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L68-L70 (getRevisionId)

	Scenario: Active snapshot row is visually distinguished and selects HTML mode on click
		Given version history data has loaded successfully
		When I click a snapshot row in the list
		Then that row should become the active row
		And the interface should switch to HTML display mode
		And the selected snapshot content should be requested
	# Evidence: public/javascripts/app/templates/restore-list.html#L58-L72 (item-active class & onItemClicked)
	# Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js#L30-L34 (onItemClicked sets HTML)
	# Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js#L41-L48 (set-active loads content)

	Scenario: Snapshot rows show created date, relative age, editor, and snapshot reason
		Given version history data has loaded successfully
		When I inspect a snapshot row
		Then I should see the formatted snapshot date and time
		And I should see a relative age value
		And I should see who last modified the content
		And I should see the snapshot reason text
	# Evidence: public/javascripts/app/templates/restore-list.html#L67-L77 (date, relative age, user, reason)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L31-L34 & #L123-L136 (getCreatedDateHtml/getRelativeDate/getUserEmail)

	Scenario: Launch-related snapshots are highlighted in row and reason styling
		Given version history data contains a launch-related snapshot reason
		When I inspect that snapshot row
		Then the row should be highlighted for launch activity
		And the reason text should be highlighted for launch activity
	# Evidence: public/javascripts/app/templates/restore-list.html#L58-L76 (highlight-row & highlight-reason for launches)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L76-L79 (isBecauseOfLaunch)

	Scenario: Legally sensitive snapshots show the legally sensitive indicator
		Given version history data contains a legally sensitive snapshot
		When I inspect the status indicators for that row
		Then I should see the legally sensitive marker
	# Evidence: public/javascripts/app/templates/restore-list.html#L83-L85 (legally-sensitive ng-show)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L81-L84 (isLegallySensitive)

	Scenario: Comment settings show comments on indicator when commentable is true
		Given version history data contains a snapshot with comments enabled
		When I inspect the status indicators for that row
		Then I should see the comments on indicator
	# Evidence: public/javascripts/app/templates/restore-list.html#L87-L95 (comments--on ng-show)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L86-L95 (commentsEnabled)

	Scenario: Comment settings show comments off indicator when commentable is false
		Given version history data contains a snapshot with comments disabled
		When I inspect the status indicators for that row
		Then I should see the comments off indicator
	# Evidence: public/javascripts/app/templates/restore-list.html#L97-L105 (comments--off ng-show)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L86-L95 (commentsEnabled)

	Scenario: Published state displays the right status label
		Given version history data contains published state variations
		When I inspect the right-hand status area for each row
		Then I should see Published for published snapshots
		And I should see Taken down for unpublished snapshots with prior publish details
		And I should see Scheduled with a date when a scheduled launch date exists
		And I should see Embargoed until with a date when embargo settings exist
	# Evidence: public/javascripts/app/templates/restore-list.html#L108-L113 (status--right getPublishedState)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L97-L121 (getPublishedState)

	Scenario: Delta rows show time difference between consecutive snapshots
		Given version history data has multiple snapshots
		When I view the delta row between two snapshots
		Then I should see a relative time difference value between adjacent snapshot dates
	# Evidence: public/javascripts/app/templates/restore-list.html#L118-L125 (delta-row relative date)
	# Evidence: public/javascripts/app/models/SnapshotIdModel.js#L123-L125 (getRelativeDate)

	Scenario: Keyboard navigation changes active snapshot when modal is not open
		Given version history data has loaded successfully
		And the restore modal is not open
		When I press the down or up arrow key
		Then the active snapshot selection should move accordingly
	# Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js#L51-L65 (down/up arrow keys)
	# Evidence: public/javascripts/app/controllers/SnapshotListCtrl.js#L51-L70 (increment/decrement-active)

	Scenario: Keyboard shortcuts do not navigate the list while modal is open
		Given the restore modal is open
		When I press list navigation keys
		Then the snapshot list selection should not change
	# Evidence: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js#L51-L89 (isDisplayingModal guards navigation)
