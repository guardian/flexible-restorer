import Dependencies._

name := "restorer2"

version := "1.0.0"

ThisBuild / scalaVersion := "2.13.12"

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature")

val awsVersion = "2.17.276"
val awsVersionV1 = "1.12.307"

libraryDependencies ++= dependencies

lazy val mainProject = project.in(file("."))
  .enablePlugins(PlayScala, JDebPackaging, SystemdPlugin)
  .settings(
    Universal / javaOptions ++= Seq(
          "-Dpidfile.path=/dev/null"
     )
  )
  .settings(Defaults.coreDefaultSettings: _*)
  .settings(
    routesGenerator := InjectedRoutesGenerator,
    Universal / packageName := s"editorial-tools:flexible:${name.value}",
    Compile / doc / sources := Seq.empty,
    Compile / packageDoc / publishArtifact := false
  )

Debian / serverLoading := Some(ServerLoader.Systemd)
debianPackageDependencies := Seq("java11-runtime-headless")
maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>"
packageSummary := "flexible-restorer"
packageDescription := """content restorer for flexible content"""
