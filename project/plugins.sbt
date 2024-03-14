// The Typesafe repository
resolvers += "Typesafe repository" at "https://repo.typesafe.com/typesafe/releases/"

// Use the Play sbt plugin for Play projects
addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.1")

addSbtPlugin("ch.epfl.scala" % "sbt-scalafix" % "0.10.3")

addSbtPlugin("net.virtual-void" % "sbt-dependency-graph" % "0.9.2")

libraryDependencies += "org.vafer" % "jdeb" % "1.3" artifacts Artifact("jdeb", "jar", "jar")
