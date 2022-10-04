name := "restorer2"

version := "1.0.0"

ThisBuild / scalaVersion := "2.12.3"

scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-Ywarn-unused-import")

val awsVersion = "2.17.276"
val awsVersionV1 = "1.12.307"

libraryDependencies ++= Seq(
    ws,
    "com.gu" %% "pan-domain-auth-play_2-8" % "1.2.0",
    "com.gu" % "kinesis-logback-appender" % "2.1.0",
    "com.gu" %% "editorial-permissions-client" % "0.8",
    "com.typesafe.play" %% "play-json-joda" % "2.6.7",
    "net.logstash.logback" % "logstash-logback-encoder" % "4.11",
    "org.eclipse.jgit" % "org.eclipse.jgit" % "5.1.1.201809181055-r",
    "commons-io" % "commons-io" % "2.6",
    "com.fasterxml.jackson.dataformat" % "jackson-dataformat-yaml" % "2.12.0",
    "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.12.0",
    "org.jsoup" % "jsoup" % "1.11.3",
    "com.lihaoyi" %% "ujson" % "0.6.6",
    "com.amazonaws" % "aws-java-sdk-s3" % awsVersionV1,
    "software.amazon.awssdk" % "s3" % awsVersion,
    "software.amazon.awssdk" % "cloudwatch" % awsVersion,
    "software.amazon.awssdk" % "kinesis" % awsVersion,
    "software.amazon.awssdk" % "utils" % awsVersion,
    "com.gu" %% "simple-configuration-ssm" % "1.5.7",
    "org.scalatest" %% "scalatest" % "3.0.5" % Test
)

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
