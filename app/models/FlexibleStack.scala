package models

import config.RestorerConfig

case class FlexibleStack(
  id: String,
  displayName: String,
  stack: String,
  stage: String,
  isSecondary: Boolean,
  apiPrefix: String,
  composerPrefix: String,
  snapshotBucket: String
)

object FlexibleStack {
  def apply(stack: String, stage: String): FlexibleStack = {
    val secondarySuffix = "-secondary"
    val domain = RestorerConfig.domainFromStage(stage)

    val isSecondary = stack.endsWith(secondarySuffix)

    val displayName = s"Composer$suffix ($stage)"
    val apiPrefix = if (isSecondary) s"http://apiv2.$stage.$stack.gudiscovery.:8080" else s"http://flexible-api.$stage.$stack.gudiscovery.:8080"
    val composerPrefix = s"https://composer$suffix.$domain"
    val snapshotBucket = s"$stack-snapshotter-${stage.toLowerCase}"

    FlexibleStack(
      s"$stage:$stack",
      displayName,
      stack,
      stage,
      isSecondary,
      apiPrefix,
      composerPrefix,
      snapshotBucket
    )
  }
}
