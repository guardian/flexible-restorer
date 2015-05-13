package models

import play.api.libs.json._
import org.joda.time.format.ISODateTimeFormat
import scala.collection.JavaConverters._
import scala.io.Source

import s3._
import config.RestorerConfig
import com.gu.restorer.helpers.Loggable
/* Template is just strings. We repreent the contentRaw as an enormous string
 * so we don't have to copy any models over or anything
 * */
case class Template(title: String, dateCreated: String, contents: String)
case class TemplateSummary(title: String, dateCreated: String)

object Template extends Loggable {

  lazy val bucket: String = RestorerConfig.templatesBucket

  lazy val s3 = new S3()

  implicit val templateWrites: Writes[Template] = new Writes[Template] {

    def writes(template: Template): JsValue = {
      Json.toJson(Map(
        "title" -> template.title,
        "dateCreated" -> template.dateCreated,
        "contents" -> template.contents
      ))
    }
  }

  def save(template: Template) = {
    // for now defer to S3 but it might go to mongo

    s3.saveItem(
      bucket,
      template.title + "_" + template.dateCreated,
      Json.stringify(Json.toJson(template)))
  }
  def retrieveAll() = {
    val req = s3.objectRequest(bucket)
    val objects = s3.getObjects(req).getObjectSummaries.asScala.toList
    val keys = objects.map(x => x.getKey())
    val results = keys.map(s3.getObjectContents(_, bucket))
    info("fetching all templates from: %s".format(bucket))
    results.map({ x =>
      val json = Json.parse(x)
      TemplateSummary(
        (json \ "title").as[String],
        (json \ "dateCreated").as[String])
    })
  }

  def retrieve(id: String) = {
    info("retrieving template with id: %s".format(id))
    val result = s3.getObjectContents(id, bucket)
    val json = Json.parse(result)
    Template(
        (json \ "title").as[String],
        (json \ "dateCreated").as[String],
        (json \ "contents").as[String])
  }
}


object TemplateSummary {
  implicit val templateSummaryWrites: Writes[TemplateSummary] = new Writes[TemplateSummary] {
    def writes(template: TemplateSummary): JsValue = {
      Json.toJson(Map(
        "title" -> template.title,
        "dateCreated" -> template.dateCreated
      ))
    }
  }
}
