# Snapshot fixtures — UI state reference

These fixtures live under `fixtures/snapshots/<contentId>/<timestamp>.json` (+ a
`.info.json` companion). The whole `fixtures/snapshots` tree is uploaded
recursively to **both** the primary (`flexible-snapshotter-code`) and secondary
(`flexible-secondary-snapshotter-code`) MinIO buckets by
`scripts/docker/start-minio-with-buckets`.

The `.info.json` file is exactly the `info` object the AngularJS
`SnapshotIdModel` consumes (`info.metadata` + `info.summary`). Each fixture was
copied from real production snapshot data; colons in the source timestamps were
replaced with underscores to match the existing fixture filename convention.
`SnapshotId` (see `app/models/SnapshotId.scala`) treats the timestamp as an
opaque string, so the rename is safe.

## State → fixture

| State | contentId | Fixture file | Key field(s) |
|---|---|---|---|
| Has revision id | `54931ae2e4b019234074e3c8` | `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | `summary.contentChangeDetails.revision = 38` |
| **Missing revision id** (synthetic) | `000000000000000000000001` | `000000000000000000000001/2026-06-26T11_26_27.839Z` | `summary.contentChangeDetails.revision` removed |
| Has editor | `6a439f538f089441710594ab` | `6a439f538f089441710594ab/2026-06-30T10_56_14.648Z` | `lastModified.user` = Andrew Howe-Ely |
| No editor | `54931ae2e4b019234074e3c8` | `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | no `lastModified.user` |
| Launch reason | `6a43d6fe8f08e1753109a384` | `6a43d6fe8f08e1753109a384/2026-06-30T14_48_33.737Z` | `metadata.reason = "Published"` |
| Non-launch reason | `54931ae2e4b019234074e3c8` | `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | `metadata.reason = "Scheduled snapshot"` |
| Legally sensitive | `5a65beade4b063d00a114104` | `5a65beade4b063d00a114104/2026-06-26T16_16_07.560Z` | `settings.legallySensitive = "true"` |
| Not legally sensitive | `569cdccee4b0e63c102ed861` | `569cdccee4b0e63c102ed861/2026-06-26T17_01_25.174Z` | `settings.legallySensitive = "false"` |
| Comments on | `54931ae2e4b019234074e3c8` | `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | `settings.commentable = "true"` |
| Comments off | `569cdccee4b0e63c102ed861` | `569cdccee4b0e63c102ed861/2026-06-26T17_01_25.174Z` | `settings.commentable = "false"` |
| Published | `54931ae2e4b019234074e3c8` | `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | `summary.published = true` |
| Taken down | `54a2b86be4b048dfa4053a48` | `54a2b86be4b048dfa4053a48/2026-06-26T12_16_14.669Z` | `published = false` + `contentChangeDetails.published` set |
| Scheduled | `58e4eab7e4b01ca21818a13e` | `58e4eab7e4b01ca21818a13e/2026-06-26T16_31_05.633Z` | `summary.scheduledLaunchDate` set |
| Embargoed | `55901e70e4b0c9bda8d8ab20` | `55901e70e4b0c9bda8d8ab20/2026-06-26T13_01_07.919Z` | `settings.embargoedUntil` set |

## Full state profile per fixture

A single snapshot exhibits several states at once. The complete set per fixture:

| Fixture file | States exhibited |
|---|---|
| `54931ae2e4b019234074e3c8/2026-06-26T11_26_27.839Z` | has_revision, no_editor, non_launch_reason, comments_on, published |
| `6a439f538f089441710594ab/2026-06-30T10_56_14.648Z` | has_revision, has_editor, non_launch_reason, not_legally_sensitive |
| `6a43d6fe8f08e1753109a384/2026-06-30T14_48_33.737Z` | has_revision, has_editor, launch_reason, not_legally_sensitive, published |
| `5a65beade4b063d00a114104/2026-06-26T16_16_07.560Z` | has_revision, no_editor, non_launch_reason, legally_sensitive, published |
| `569cdccee4b0e63c102ed861/2026-06-26T17_01_25.174Z` | has_revision, no_editor, non_launch_reason, not_legally_sensitive, comments_off, published |
| `54a2b86be4b048dfa4053a48/2026-06-26T12_16_14.669Z` | has_revision, no_editor, non_launch_reason, comments_on, taken_down |
| `58e4eab7e4b01ca21818a13e/2026-06-26T16_31_05.633Z` | has_revision, no_editor, non_launch_reason, not_legally_sensitive, comments_on, scheduled |
| `55901e70e4b0c9bda8d8ab20/2026-06-26T13_01_07.919Z` | has_revision, no_editor, non_launch_reason, comments_on, embargoed, published |
| `000000000000000000000001/2026-06-26T11_26_27.839Z` | **missing_revision** (synthetic), no_editor, non_launch_reason, comments_on, published |

## Notes

- **Missing revision id** does not occur in real production data (0 of 13,153
  snapshots lacked a revision), so `000000000000000000000001` is a hand-crafted
  fixture: a copy of the published example with
  `summary.contentChangeDetails.revision` deleted from its `.info.json`.
- **Primary vs Secondary system** is **not** a property of the snapshot. It is
  derived from stack config (`stack.id` / `stack.isSecondary`) when the version
  list is built (`app/controllers/Versions.scala`). Because the fixture tree is
  uploaded to both the primary and secondary buckets, the same fixture appears
  under each stack — exercise the secondary path by targeting the secondary
  stack rather than by choosing a different snapshot file.
