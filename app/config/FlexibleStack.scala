package config

case class FlexibleStack(stack: String, stage: String) {
  val secondarySuffix = "-secondary"

  val domain: String = RestorerConfig.domainFromStage(stage)

  val isSecondary = stack.endsWith(secondarySuffix)
  val suffix = if (isSecondary) secondarySuffix else ""

  val apiPrefix: String = s"http://api.$stage.$stack.gudiscovery.:8080"

  val composerPrefix: String = s"https://composer$suffix.$domain"
}
