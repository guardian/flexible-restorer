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
    riffRaffPackageType := (packageZipTarball in config("universal")).value,
    riffRaffArtifactResources ++= Seq(
      baseDirectory.value / "cloudformation" / "restorer.json" ->
        "packages/cloudformation/restorer.json"
    )
  )
