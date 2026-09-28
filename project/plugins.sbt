// The Typesafe repository
resolvers += "Typesafe repository" at "https://repo.typesafe.com/typesafe/releases/"

// Use the Play sbt plugin for Play projects
addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.11")

libraryDependencies += "org.vafer" % "jdeb" % "1.3" artifacts Artifact("jdeb", "jar", "jar")

// Fingerprints public assets (adds an MD5 to their filenames) so `Assets.versioned`
// can serve them with far-future cache headers and bust the cache on any change.
addSbtPlugin("com.typesafe.sbt" % "sbt-digest" % "1.1.4")

// Pre-compresses public assets to `.gz` at build time so Play can serve the
// compressed copy without gzipping on every request.
addSbtPlugin("com.github.sbt" % "sbt-gzip" % "2.0.0")

addDependencyTreePlugin
