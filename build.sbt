import com.typesafe.sbt.packager.Keys._

name := "restorer"

version := "0.0.1"

libraryDependencies ++= Seq(
  "com.gu" %% "pan-domain-auth-play" % "0.2.6",
  "net.logstash.logback" % "logstash-logback-encoder" % "4.1",
  "com.gu" %% "editorial-permissions-client" % "0.2",
  ws
)

lazy val mainProject = project.in(file("."))
  .enablePlugins(PlayScala, RiffRaffArtifact)
  .settings(Defaults.coreDefaultSettings: _*)
  .settings(
    // Never interested in the version number in the artifact name
    name in Universal := normalizedName.value,
    riffRaffPackageName := s"editorial-tools:${name.value}",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffBuildIdentifier :=  Option(System.getenv("CIRCLE_BUILD_NUM")).getOrElse("dev"),
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffManifestBranch := Option(System.getenv("CIRCLE_BRANCH")).getOrElse("dev"),
    riffRaffPackageType := (packageZipTarball in config("universal")).value,
    riffRaffArtifactResources ++= Seq(
      riffRaffPackageType.value -> s"packages/${name.value}/${name.value}.tgz",
      baseDirectory.value / "cloudformation" / "presence.json" ->
        "packages/cloudformation/presence.json"
    ))
