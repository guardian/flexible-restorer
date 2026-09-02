import play.sbt.PlayImport.ws
import sbt._

object Dependencies {
  val awsVersion = "2.25.70"
  val awsVersionV1 = "1.12.584"

  val awsDependencies = Seq(
    "software.amazon.awssdk" % "s3" % awsVersion
  )

  val guardianDependencies = Seq(
    "com.gu" %% "pan-domain-auth-play_3-0" % "13.0.0",
    "com.gu" %% "editorial-permissions-client" % "6.0.1",
    "com.gu" %% "simple-configuration-ssm" % "2.0.0"
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
    "org.jsoup" % "jsoup" % "1.17.2",
    "com.lihaoyi" %% "ujson" % "3.3.1",
  ) ++ awsDependencies ++ guardianDependencies ++ testDependencies
}
