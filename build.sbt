import com.typesafe.sbt.packager.Keys._

name := "restorer"

version := "0.0.1"

val awsSdkVersion = "1.10.56"

libraryDependencies ++= Seq(
  "com.gu" %% "pan-domain-auth-play" % "0.2.11",
  "net.logstash.logback" % "logstash-logback-encoder" % "4.6",
  "com.gu" % "kinesis-logback-appender" % "1.2.0",
  // 0.3 doesn't have this dependency but is only targetted at 2.11
  "com.gu" %% "editorial-permissions-client" % "0.2" exclude("com.amazonaws", "aws-java-sdk"),
  "com.amazonaws" % "aws-java-sdk-s3" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-ec2" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsSdkVersion,
  ws,
  "org.scalatest" %% "scalatest" % "2.2.6" % Test
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
      baseDirectory.value / "cloudformation" / "restorer.json" ->
        "packages/cloudformation/restorer.json"
    ))
