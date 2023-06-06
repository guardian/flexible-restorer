import play.sbt.PlayImport._
import sbt._

object Dependencies {
  val awsVersion = "2.17.276"
  val awsVersionV1 = "1.12.307"

  val awsDependencies = Seq(
    "com.amazonaws" % "aws-java-sdk-s3" % awsVersionV1,
    "software.amazon.awssdk" % "s3" % awsVersion,
    "software.amazon.awssdk" % "cloudwatch" % awsVersion,
    "software.amazon.awssdk" % "kinesis" % awsVersion,
    "software.amazon.awssdk" % "utils" % awsVersion
  )

  val guardianDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_2-8" % "1.2.0",
    "com.gu" % "kinesis-logback-appender" % "2.1.0",
    "com.gu" %% "editorial-permissions-client" % "2.0",
    "com.gu" %% "simple-configuration-ssm" % "1.5.7"
  )

  val testDependencies = Seq(
    "org.scalatest" %% "scalatest" % "3.0.5" % Test
  )

  val dependencies = Seq(
    ws,
    "com.typesafe.play" %% "play-json-joda" % "2.6.7",
    "net.logstash.logback" % "logstash-logback-encoder" % "4.11",
    "org.eclipse.jgit" % "org.eclipse.jgit" % "5.1.1.201809181055-r",
    "commons-io" % "commons-io" % "2.6",
    "com.fasterxml.jackson.dataformat" % "jackson-dataformat-yaml" % "2.12.0",
    "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.12.0",
    "org.jsoup" % "jsoup" % "1.11.3",
    "com.lihaoyi" %% "ujson" % "0.6.6",
    "org.scala-lang" % "scala-compiler" % "2.12.3",
  ) ++ awsDependencies ++ guardianDependencies ++ testDependencies
}
