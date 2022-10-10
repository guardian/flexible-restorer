import Dependencies._

name := "restorer2"

version := "1.0.0"

ThisBuild / scalaVersion := "2.12.3"

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-Ywarn-unused-import")

val awsVersion = "2.17.276"
val awsVersionV1 = "1.12.307"

libraryDependencies ++= dependencies

lazy val mainProject = project.in(file("."))
  .enablePlugins(PlayScala, RiffRaffArtifact)
  .enablePlugins(JDebPackaging, SystemdPlugin)
  .settings(
    Universal / javaOptions ++= Seq(
          "-Dpidfile.path=/dev/null"
     )
  )
  .settings(Defaults.coreDefaultSettings: _*)
  .settings(
    routesGenerator := InjectedRoutesGenerator,
    riffRaffPackageName := s"editorial-tools:flexible:${name.value}",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffBuildIdentifier :=  Option(System.getenv("BUILD_NUMBER")).getOrElse("dev"),
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffManifestBranch := Option(System.getenv("BRANCH_NAME")).getOrElse("dev"),
    riffRaffArtifactResources := Seq(
      (Debian / packageBin).value -> s"${name.value}/${name.value}.deb",
         baseDirectory.value / "riff-raff.yaml" -> "riff-raff.yaml"
    ),
    Compile / doc / sources := Seq.empty,
    Compile / packageDoc / publishArtifact := false
  )

Debian / serverLoading := Some(ServerLoader.Systemd)

debianPackageDependencies := Seq("openjdk-8-jre-headless")
maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>"
packageSummary := "flexible-restorer"
packageDescription := """content restorer for flexible content"""
