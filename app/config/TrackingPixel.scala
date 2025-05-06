package config

case class TrackingPixel(telemetryStage: TelemetryStage) {
  def urlFor(path: String): String = {
    return s"${telemetryStage.backend()}/guardian-tool-accessed?app=restorer&path=${path}"
  }
}

sealed trait TelemetryStage {
  def backend(): String = {
    this match {
      case TelemetryPROD => "https://user-telemetry.gutools.co.uk"
      case TelemetryCODE => "https://user-telemetry.code.dev-gutools.co.uk"
      case TelemetryDEV => "https://user-telemetry.local.dev-gutools.co.uk"
    }
  }
}

case object TelemetryPROD extends TelemetryStage
case object TelemetryCODE extends TelemetryStage
case object TelemetryDEV extends TelemetryStage
