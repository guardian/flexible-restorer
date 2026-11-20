import play.sbt.PlayImport.ws
import sbt._

object Dependencies {
  val awsVersion = "2.55.11"
  val awsVersionV1 = "1.12.584"

  val awsDependencies = Seq(
    "software.amazon.awssdk" % "s3" % awsVersion
  )

  val guardianDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_3-0" % "23.0.0-PREVIEW.introduce-play-free-response-strategy.2026-10-29T1048.7f1596ad",
    "com.gu" %% "editorial-permissions-client" % "6.0.1",
    "com.gu" %% "simple-configuration-ssm" % "15.0.0"
  )

  val testDependencies = Seq(
    "org.scalatest" %% "scalatest" % "3.2.19" % Test
  )

  val dependencies = Seq(
    ws,
    "org.playframework" %% "play-json-joda" % "3.0.6",
    "net.logstash.logback" % "logstash-logback-encoder" % "7.4",
    "org.eclipse.jgit" % "org.eclipse.jgit" % "5.13.5.202508271544-r",
    "commons-io" % "commons-io" % "2.16.1",
    "com.fasterxml.jackson.dataformat" % "jackson-dataformat-yaml" % "2.17.0",
    "com.fasterxml.jackson.module" %% "jackson-module-scala" % "2.17.0",
    "org.jsoup" % "jsoup" % "1.23.2",
    "com.lihaoyi" %% "ujson" % "4.4.3",
  ) ++ awsDependencies ++ guardianDependencies ++ testDependencies
}
