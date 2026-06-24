# Domain Catalog

Baseline catalog rendered from `tests/bdd-results/domain-catalog.json`.

| # | Domain | Frontend | Routes | Controller Actions |
|---|--------|----------|--------|--------------------|
| 1 | Content Search & Entry | SearchFormCtrl.js, splash-screen.html | GET /, GET /content/:contentId/versions | Application.index, Application.versionIndex |
| 2 | Version History & Snapshot Metadata | SnapshotListCtrl.js, SnapshotIdModel.js, SnapshotIdModels.js | GET /api/1/versionList/:contentId, GET /api/1/version-count/:contentId | Versions.versionList, Versions.availableVersionsCount |
| 3 | Snapshot Content Viewing | SnapshotContentCtrl.js, SnapshotModel.js | GET /api/1/version/:systemId/:contentId/:timestamp | Versions.show |
| 4 | Snapshot Interaction & Navigation | SnapshotListInteractionCtrl.js, ModalController.js | (client-side only) | (none) |
| 5 | Restore Workflow | RestoreFormCtrl.js, RestoreService.js | POST /api/1/restore/:sourceId/:contentId/:timestamp/to/:destinationId, GET /api/1/restore/destinations/:contentId | Restore.restore, Restore.restoreDestinations |
| 6 | Authentication & Permissions | UserService.js | GET /oauthCallback, GET /authError, GET /api/1/user, GET /api/1/user/permissions | Login.oauthCallback, Login.authError, Login.user, Login.usersPermissions |
| 7 | Export | restore-list.html (export links) | GET /export/:contentId/git, GET /export/:contentId/zip | Export.exportAsGitRepo, Export.exportAsZip |
| 8 | Analytics & Telemetry | AnalyticsService.js, main.js, track:event publishers | (external telemetry client) | (none) |
| 9 | Operations & Health | (none) | GET /management/healthcheck, GET /management/info | Management.healthCheck, Management.info |
| 10 | Error Handling | ErrorCtrl.js, mediator.js, restore-list.html | (client-side only) | (none) |

## Evidence by Type

### Frontend files
- Controllers: SearchFormCtrl, SnapshotListCtrl, SnapshotListInteractionCtrl, SnapshotContentCtrl, RestoreFormCtrl, ModalController, ErrorCtrl
- Services: RestoreService, UserService, AnalyticsService (support: DateFormatService, SnapshotCollectionService)
- Models/collections: SnapshotIdModel, SnapshotModel, SnapshotIdModels
- Templates: splash-screen.html, restore-list.html

### Backend routes
- App: GET /, GET /content/:contentId/versions
- Versions API: versionList, version show, version-count
- Restore API: restore, restore destinations
- Auth: oauthCallback, authError, user, user/permissions
- Export: git, zip
- Management: healthcheck, info

### Controller actions
- Application.index, Application.versionIndex
- Versions.versionList, Versions.availableVersionsCount, Versions.show
- Restore.restore, Restore.restoreDestinations
- Login.oauthCallback, Login.authError, Login.user, Login.usersPermissions
- Export.exportAsGitRepo, Export.exportAsZip
- Management.healthCheck, Management.info

## Notes
- Shared gu-components (lib/*) and support services contribute evidence across domains rather than forming a standalone domain.
- Application.preflight provides CORS preflight support and is not a user-facing domain.
