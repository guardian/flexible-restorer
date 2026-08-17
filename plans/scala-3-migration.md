# Scala 2.13 → Scala 3 migration plan

## Summary

This is a **low-risk, small migration**. The codebase is ~15 small Scala files plus 2 Twirl
templates and 1 test. It is already on Play 3.0 / Scala 2.13.18, which is the ideal starting
point.

**Verified empirically**: compiling the whole project (`compile` + `Test/compile`) with
`-Xsource:3-cross` — the Scala 2.13 flag that enforces Scala 3 semantics — produces exactly
**one** error, and the codebase compiles cleanly once it is fixed. See Phase 2.

**Verified via Maven Central**: every cross-built dependency has a `_3` artifact. Only one
version bump is forced (`editorial-permissions-client`, a patch bump).

Recommended approach: **big-bang, single PR**. Cross-building (`crossScalaVersions`) is not
worth the ceremony for an app this size that isn't published as a library.

---

## Phase 0 — Prerequisites & baseline

1. Confirm a green baseline on the current setup so any later failure is attributable:
   ```shell
   sbt clean compile test Debian/packageBin
   ```
2. Note the runtime constraints that **do not change**: JDK 11 (`.tool-versions` =
   `corretto-11`, `debianPackageDependencies := Seq("java11-runtime-headless")`,
   Riff-Raff recipe `editorial-tools-jammy-java11`). Scala 3.3 LTS supports JDK 8–21,
   so **no JDK upgrade is required**. Deployment, `.deb` packaging and `riff-raff.yaml`
   are unaffected.
3. The `cdk/` directory is TypeScript and is entirely out of scope.

**Target version: Scala 3.3.8 (LTS).** Do not jump to 3.4+/3.9 — Play, play-json and the
Guardian libraries are all built and tested against the 3.3 LTS line.

---

## Phase 1 — Pre-migration cleanups (do first, on Scala 2.13, separately mergeable)

These are all source- and behaviour-compatible with Scala 2.13, so they can land and be
deployed ahead of the switch, shrinking the actual migration diff.

1. **Fix the `BodyWritable` import** (the one real blocker — see Phase 2 for why).
   In [app/logic/FlexibleApi.scala](app/logic/FlexibleApi.scala) add:
   ```scala
   import play.api.libs.ws.JsonBodyWritables._
   ```
2. **Rename the test package.** [test/scala/models/SnapshotIdSpec.scala](test/scala/models/SnapshotIdSpec.scala)
   declares `package scala.models`, i.e. it nests a user package inside the root `scala`
   package. This shadows the standard library namespace and is a latent hazard under
   Scala 3's stricter resolution. Change to `package models` and move the file to
   `test/models/` (also drop the redundant `scala/` path segment).
3. **Bump `editorial-permissions-client` 6.0.0 → 6.0.1** in
   [project/Dependencies.scala](project/Dependencies.scala). This is the *only* forced
   dependency change: 6.0.0 has no `_3` artifact, 6.0.1 does. Verify the app still
   builds and behaves on 2.13 first.
4. **Bump the build toolchain** (independent of Scala 3, but smooths the path):
   - [project/build.properties](project/build.properties): sbt `1.9.9` → `1.11.x`
   - [project/plugins.sbt](project/plugins.sbt): `sbt-scalafix` `0.10.3` → `0.14.x`
     — 0.10.3 predates Scala 3 support. There is no `.scalafix.conf` in the repo and
     scalafix isn't run in CI, so **deleting the plugin outright is the better option**.
   - Also consider removing `sbt-dependency-graph` 0.9.2; it is superseded by the
     `addDependencyTreePlugin` line already present two lines below it.
   - `sbt-plugin` `3.0.10` → `3.0.11` (optional; 3.0.10 already supports Scala 3).

---

## Phase 2 — Understand the single real incompatibility

Running `sbt 'set ThisBuild / scalacOptions += "-Xsource:3-cross"' compile` on the current
code fails with:

```
app/logic/FlexibleApi.scala:35: Cannot find an instance of play.api.libs.json.JsValue to WSBody.
app/logic/FlexibleApi.scala:50: Cannot find an instance of play.api.libs.json.JsValue to WSBody.
```

**Cause.** `wsClient.url(...).put(snapshot.data)` needs an implicit
`BodyWritable[JsValue]`. Play WS supplies it via `package object ws extends WSBodyWritables`.
Scala 2 includes the members of a *package object* in the implicit scope of types in that
package; **Scala 3 removed that rule**. Since [app/logic/FlexibleApi.scala](app/logic/FlexibleApi.scala)
imports only `play.api.libs.ws.WSClient` (not `play.api.libs.ws._`), the instance becomes
invisible under Scala 3 semantics.

**Fix.** The explicit import in Phase 1 step 1. Confirmed: with that one line added, both
`compile` and `Test/compile` pass under `-Xsource:3-cross` with zero errors.

This is the highest-value finding of the investigation — it is a *silent* difference that
would otherwise only appear after flipping `scalaVersion`.

---

## Phase 3 — Flip to Scala 3

1. [build.sbt](build.sbt):
   ```scala
   ThisBuild / scalaVersion := "3.3.8"

   scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature")
   ```
   (`-unchecked`, `-deprecation`, `-feature` are all valid Scala 3 flags — no change needed.)
2. [project/Dependencies.scala](project/Dependencies.scala): no `%%` → `%` changes are
   required. Every cross-built dependency publishes `_3` at (or near) the pinned version:

   | Dependency | Pinned | `_3` available? |
   |---|---|---|
   | `com.gu` pan-domain-auth-play_3-0 | 13.0.0 | ✅ yes at 13.0.0 |
   | `com.gu` editorial-permissions-client | 6.0.0 | ❌ — **bump to 6.0.1** |
   | `com.gu` simple-configuration-ssm | 2.0.0 | ✅ yes at 2.0.0 |
   | `org.playframework` play-json-joda | 3.0.6 | ✅ yes at 3.0.6 |
   | `com.fasterxml.jackson.module` jackson-module-scala | 2.17.0 | ✅ yes at 2.17.0 |
   | `com.lihaoyi` ujson | 3.3.1 | ✅ yes at 3.3.1 |
   | `org.scalatest` scalatest | 3.2.19 | ✅ yes |

   Java-only deps (`software.amazon.awssdk` ×4, logstash-logback-encoder, jgit, commons-io,
   jackson-dataformat-yaml, jsoup) are unaffected.

   Note pan-domain-auth 13.0.0 already has a Scala 3 build, so **stay on 13.0.0**. Do not
   opportunistically jump to the latest (21.0.0) — versions 14→21 include breaking
   `PanDomainAuthSettingsRefresher` / `AuthActions` API changes that would balloon the diff.
   Treat that as separate work.
3. Run `sbt clean compile Test/compile test`. Expect it to pass first time given Phase 2.
4. Fix any residual `Json.format` macro errors. play-json 3.0's Scala 3 macros are
   inline-based rather than blackbox macros. The nine `Json.format[...]` call sites
   ([SnapshotId](app/models/SnapshotId.scala), [User](app/models/User.scala),
   [Version](app/models/Version.scala), [VersionCount](app/models/VersionCount.scala),
   [SnapshotMetadata](app/models/SnapshotMetadata.scala),
   [ChangeDetails](app/models/ChangeDetails.scala), [Destination](app/models/Destination.scala))
   all use plain case classes with explicitly-typed `implicit val`s, which is the
   well-supported shape. Watch for: if any case class ever gains default parameter values
   and is used with `Json.using[Json.WithDefaultValues]`, Scala 3 additionally requires
   the `-Yretain-trees` compiler flag.

---

## Phase 4 — Deprecation clean-up (optional, same PR or follow-up)

These compile fine on Scala 3.3 but warn, and will break on `-source:future` / Scala 3.4+:

- `: _*` → `*` in [app/controllers/Application.scala](app/controllers/Application.scala#L49)
  (`config.corsableDomains: _*`).
- Postfix operators in [app/controllers/Restore.scala](app/controllers/Restore.scala):
  `3 seconds` → `3.seconds`, then delete `import scala.language.postfixOps`.
- Renaming import `{global => globalExecutionContext}` in
  [app/AppComponents.scala](app/AppComponents.scala#L16) → `{global as globalExecutionContext}`.
- Do **not** convert `implicit` → `given` / `using`, or rewrite braces to significant
  indentation. That is churn with no benefit and makes the migration hard to review.

---

## Phase 5 — Verification

Compile-time success is necessary but not sufficient: Play's DI wiring
([AppComponents](app/AppComponents.scala)) and the JSON formats are the parts most likely
to surface a behavioural difference.

1. `sbt clean compile test Debian/packageBin` — matches the CI command in
   [.github/workflows/ci.yml](.github/workflows/ci.yml).
2. Confirm the Twirl templates ([main.scala.html](app/views/main.scala.html),
   [authError.scala.html](app/views/authError.scala.html)) and the generated `router.Routes`
   compile — both are handled by the Play 3.0 plugin's Scala 3 support, but they are
   codegen and worth eyeballing.
3. Run locally and smoke-test each route in [conf/routes](conf/routes), specifically:
   - pan-domain auth redirect + `/oauthCallback` (exercises the Guardian auth libs)
   - `/versions/:contentId` list (exercises S3 + `Json.format[SnapshotId]`)
   - `restoreDestinations` (exercises `Json.format[Destination]` with the Joda
     `DateTime` reads/writes — the most intricate format in the codebase)
   - a `PUT` restore (exercises the **exact** `BodyWritable` code path fixed in Phase 2)
   - `/export/:contentId` zip and git export
   - the CORS `preflight` route (exercises the varargs change)
4. Deploy to CODE and exercise the above before PROD.

---

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `BodyWritable[JsValue]` implicit not found | **Certain** | Explicit import (Phase 1.1) — already proven |
| `editorial-permissions-client` has no `_3` at 6.0.0 | **Certain** | Bump to 6.0.1 (patch) |
| play-json macro differences | Low | All formats use the simple case-class shape; covered by Phase 5.3 |
| Twirl / routes codegen under Scala 3 | Low | Supported since Play 2.9/3.0; caught at compile time |
| pan-domain-auth API drift | Low | Stay on 13.0.0, which has a `_3` build |
| Runtime-only DI failure in `AppComponents` | Low | Compile-time wiring (no runtime injection); Phase 5.3 smoke test |

## Effort shape

One PR for Phase 1 (cleanups, deployable on 2.13), one PR for Phases 3–4 (the flip). The
`-Xsource:3-cross` result means the second PR should be close to a three-line diff plus
deprecation tidying.
