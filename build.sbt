name := "restorer2"

version := "1.0.0"

scalaVersion in ThisBuild := "2.11.11"

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-Ywarn-unused-import")

val awsSdkVersion = "1.11.5"

libraryDependencies ++= Seq(
    ws,
    "com.gu" %% "pan-domain-auth-play_2-6" % "0.5.1",
    "com.typesafe.play" % "play-json-joda_2.11" % "2.6.7",
    "net.logstash.logback" % "logstash-logback-encoder" % "4.11",
    "com.gu" % "kinesis-logback-appender" % "1.4.2",
    "com.gu" %% "editorial-permissions-client" % "0.3",
    "com.amazonaws" % "aws-java-sdk-s3" % awsSdkVersion,
    "com.amazonaws" % "aws-java-sdk-ec2" % awsSdkVersion,
    "com.amazonaws" % "aws-java-sdk-cloudwatch" % awsSdkVersion,
    "com.amazonaws" % "aws-java-sdk-kinesis" % awsSdkVersion,
    "com.amazonaws" % "aws-java-sdk-sts" % awsSdkVersion,
    "org.scalatest" %% "scalatest" % "2.2.6" % Test
)

lazy val mainProject = project.in(file("."))
  .enablePlugins(PlayScala, RiffRaffArtifact)
  .enablePlugins(JDebPackaging)
  .settings(
    javaOptions in Universal ++= Seq(
          "-Dpidfile.path=/dev/null"
     )
  )
  .settings(Defaults.coreDefaultSettings: _*)
  .settings(
    routesGenerator := InjectedRoutesGenerator,
    riffRaffPackageName := s"editorial-tools:flexible:${name.value}",
    riffRaffManifestProjectName := riffRaffPackageName.value,
    riffRaffBuildIdentifier :=  Option(System.getenv("BUILD_NUM")).getOrElse("dev"),
    riffRaffUploadArtifactBucket := Option("riffraff-artifact"),
    riffRaffUploadManifestBucket := Option("riffraff-builds"),
    riffRaffManifestBranch := Option(System.getenv("BRANCH_NAME")).getOrElse("dev"),
    riffRaffArtifactResources := Seq(
      (packageBin in Debian).value -> s"${name.value}/${name.value}.deb",
         baseDirectory.value / "riff-raff.yaml" -> "riff-raff.yaml"
    ),
    sources in (Compile,doc) := Seq.empty,
    publishArtifact in (Compile, packageDoc) := false
  )

serverLoading in Debian := Some(ServerLoader.Systemd)

debianPackageDependencies := Seq("openjdk-8-jre-headless")
maintainer := "Digital CMS <digitalcms.dev@guardian.co.uk>"
packageSummary := "flexible-restorer"
packageDescription := """content restorer for flexible content"""
