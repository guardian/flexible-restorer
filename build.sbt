name := "restorer2"

version := "1.0.0"

scalaVersion in ThisBuild := "2.11.8"

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-Xfatal-warnings")

val awsSdkVersion = "1.11.5"

libraryDependencies ++= Seq(
  "com.amazonaws" % "aws-lambda-java-core" % "1.1.0",
  "com.amazonaws" % "aws-lambda-java-events" % "1.1.0" intransitive(),
  "com.amazonaws" % "aws-lambda-java-log4j" % "1.0.0",
  "com.gu" %% "pan-domain-auth-play_2-5" % "0.3.0",
  "net.logstash.logback" % "logstash-logback-encoder" % "4.6",
  "com.gu" % "kinesis-logback-appender" % "1.2.0",
  "com.gu" %% "editorial-permissions-client" % "0.3",
  "com.amazonaws" % "aws-java-sdk-s3" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-ec2" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-kinesis" % awsSdkVersion,
  "com.amazonaws" % "aws-java-sdk-sts" % awsSdkVersion,
  "com.typesafe.play" %% "play-test" % "2.5.3",
  ws,
  "org.scalatest" %% "scalatest" % "2.2.6" % Test
)

publishMavenStyle := false

lazy val mainProject = project.in(file("."))
  .enablePlugins(PlayScala, RiffRaffArtifact)
  .settings(Defaults.coreDefaultSettings: _*)
  .settings(
    routesGenerator := InjectedRoutesGenerator,
    // Never interested in the version number in the artifact name
    name in Universal := normalizedName.value,
    topLevelDirectory in Universal := None,
    riffRaffPackageName := s"editorial-tools:flexible:${name.value}",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffBuildIdentifier :=  Option(System.getenv("CIRCLE_BUILD_NUM")).getOrElse("dev"),
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffManifestBranch := Option(System.getenv("CIRCLE_BRANCH")).getOrElse("dev"),
    riffRaffPackageType := (packageZipTarball in config("universal")).value,
    riffRaffArtifactResources ++= Seq(
      riffRaffPackageType.value -> s"packages/${name.value}/${name.value}.tgz"
    ),
    sources in (Compile,doc) := Seq.empty,
    publishArtifact in (Compile, packageDoc) := false
  )
