import play.sbt.PlayImport.ws
import sbt._

object Dependencies {
  val awsVersion = "2.23.13"
  val awsVersionV1 = "1.12.470"

  val awsDependencies = Seq(
    "com.amazonaws" % "aws-java-sdk-s3" % awsVersionV1,
    "software.amazon.awssdk" % "s3" % awsVersion,
    "software.amazon.awssdk" % "cloudwatch" % awsVersion,
    "software.amazon.awssdk" % "kinesis" % awsVersion,
    "software.amazon.awssdk" % "utils" % awsVersion
  )

  val guardianDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_3-0" % "3.0.1",
    "com.gu" %% "editorial-permissions-client" % "2.15",
    "com.gu" %% "simple-configuration-ssm" % "1.6.4"
  )

  val testDependencies = Seq(
    "org.scalatest" %% "scalatest" % "3.2.17" % Test
  )

  val dependencies = Seq(
    ws,
    "org.playframework" %% "play-json-joda" % "3.0.1",
    "net.logstash.logback" % "logstash-logback-encoder" % "7.3",
    "org.eclipse.jgit" % "org.eclipse.jgit" % "5.1.1.201809181055-r",
    "commons-io" % "commons-io" % "2.15.1",
    "com.fasterxml.jackson.dataformat" % "jackson-dataformat-yaml" % "2.12.0",
    "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.14.3",
    "org.jsoup" % "jsoup" % "1.11.3",
    "com.lihaoyi" %% "ujson" % "3.1.4",
  ) ++ awsDependencies ++ guardianDependencies ++ testDependencies
}
