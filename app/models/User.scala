package models

import play.api.libs.json.Json

case class User(email: String, firstName: String, lastName: String)

object User {
  implicit val formats = Json.format[User]
}
