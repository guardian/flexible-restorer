import com.typesafe.sbt.packager.Keys._

name := "composer-restorer"

version := "0.0.1"

libraryDependencies ++= Seq(
  "com.gu" %% "pan-domain-auth-play" % "0.2.6",
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
