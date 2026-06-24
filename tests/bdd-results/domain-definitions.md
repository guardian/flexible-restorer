# Domain Definitions

Derived from source: frontend JavaScript under `public/javascripts`, backend routes in `conf/routes`, and controllers in `app/controllers`.

## 1. Content Search & Entry
- Description: Entry point where an editor submits a Composer URL or content id and is routed to that content's version history.
- Keywords: search, splash, composer url, content id, navigate, versions route
- Evidence:
  - Frontend: public/javascripts/app/controllers/SearchFormCtrl.js, public/javascripts/app/templates/splash-screen.html
  - Routes: GET /, GET /content/:contentId/versions
  - Controllers: controllers.Application.index, controllers.Application.versionIndex

## 2. Version History & Snapshot Metadata
- Description: Listing of available snapshots for a piece of content with per-snapshot metadata (revision, dates, editor, status, indicators).
- Keywords: version list, snapshot list, revision, metadata, secondary, published state, count
- Evidence:
  - Frontend: public/javascripts/app/controllers/SnapshotListCtrl.js, public/javascripts/app/models/SnapshotIdModel.js, public/javascripts/app/collections/SnapshotIdModels.js
  - Routes: GET /api/1/versionList/:contentId, GET /api/1/version-count/:contentId
  - Controllers: controllers.Versions.versionList, controllers.Versions.availableVersionsCount

## 3. Snapshot Content Viewing
- Description: Display of a selected snapshot's rendered HTML and JSON content, including headline/standfirst/trailtext and copy/toggle actions.
- Keywords: content panel, html, json, toggle, copy, headline, standfirst, trailtext
- Evidence:
  - Frontend: public/javascripts/app/controllers/SnapshotContentCtrl.js, public/javascripts/app/models/SnapshotModel.js
  - Routes: GET /api/1/version/:systemId/:contentId/:timestamp
  - Controllers: controllers.Versions.show

## 4. Snapshot Interaction & Navigation
- Description: Keyboard navigation, row selection, view-mode switching, and modal open/close behavior across the version view.
- Keywords: keyboard, arrow keys, enter, escape, modal, active row, view state
- Evidence:
  - Frontend: public/javascripts/app/controllers/SnapshotListInteractionCtrl.js, public/javascripts/app/controllers/ModalController.js
  - Routes: (none; client-side only)

## 5. Restore Workflow
- Description: Restoring a selected snapshot to a permitted destination stack, including destination loading, permission filtering, safety checks, and submission.
- Keywords: restore, destination, stack, permission, safety checks, redirect to composer
- Evidence:
  - Frontend: public/javascripts/app/controllers/RestoreFormCtrl.js, public/javascripts/app/services/RestoreService.js
  - Routes: POST /api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId, GET /api/1/restore/destinations/:contentId
  - Controllers: controllers.Restore.restore, controllers.Restore.restoreDestinations

## 6. Authentication & Permissions
- Description: Pan-domain authentication gating, access-denied handling, and exposure of current user and permission data.
- Keywords: auth, pan-domain, permissions, access denied, restorer access, user
- Evidence:
  - Frontend: public/javascripts/app/services/UserService.js
  - Routes: GET /oauthCallback, GET /authError, GET /api/1/user, GET /api/1/user/permissions
  - Controllers: controllers.Login.oauthCallback, controllers.Login.authError, controllers.Login.user, controllers.Login.usersPermissions
  - Backend: app/auth/PanDomainAuthActions.scala, app/permissions/Permissions.scala

## 7. Export
- Description: Downloading a piece of content's snapshot history as a zip archive or as a git repository archive.
- Keywords: export, zip, git repository, download, archive
- Evidence:
  - Frontend: public/javascripts/app/templates/restore-list.html (export links)
  - Routes: GET /export/:contentId/git, GET /export/:contentId/zip
  - Controllers: controllers.Export.exportAsGitRepo, controllers.Export.exportAsZip

## 8. Analytics & Telemetry
- Description: Page-visit tracking and snapshot interaction events (viewed, active, copied, restored).
- Keywords: analytics, telemetry, tracking pixel, track:event
- Evidence:
  - Frontend: public/javascripts/app/services/AnalyticsService.js, public/javascripts/app/main.js, plus track:event publishers in SnapshotContentCtrl.js, SnapshotListCtrl.js, SnapshotListInteractionCtrl.js, RestoreService.js
  - Routes: (external telemetry client)

## 9. Operations & Health
- Description: Operational endpoints for health checking and authenticated system information.
- Keywords: healthcheck, management info, hostname, stacks
- Evidence:
  - Routes: GET /management/healthcheck, GET /management/info
  - Controllers: controllers.Management.healthCheck, controllers.Management.info

## 10. Error Handling
- Description: Centralized in-app error surfacing through a shared error modal driven by mediator error events.
- Keywords: error modal, mediator, error message, failure surface
- Evidence:
  - Frontend: public/javascripts/app/controllers/ErrorCtrl.js, public/javascripts/app/utils/mediator.js, public/javascripts/app/templates/restore-list.html
  - Routes: (none; client-side only)
