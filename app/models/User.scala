package models

import play.api.libs.json.{Json, Format}

case class User(email: String, firstName: String, lastName: String)

object User {
  implicit val formats: Format[User] = Json.format[User]
}
