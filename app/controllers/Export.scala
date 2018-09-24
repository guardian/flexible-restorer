package controllers

import java.io.FileOutputStream
import java.nio.charset.StandardCharsets
import java.nio.file.attribute.BasicFileAttributes
import java.nio.file.{FileVisitResult, Files, Path, SimpleFileVisitor}
import java.time.Instant
import java.util.Date
import java.util.zip.{ZipEntry, ZipOutputStream}

import com.fasterxml.jackson.databind.{JsonNode, ObjectMapper}
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotApi
import models.{FlexibleStack, SnapshotId}
import org.apache.commons.io.FileUtils
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.lib.PersonIdent
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.Await
import scala.concurrent.duration._

class Export(override val controllerComponents: ControllerComponents, snapshotApi: SnapshotApi, override val config: RestorerConfig,
             override val wsClient: WSClient, val panDomainSettings: PanDomainAuthSettingsRefresher)

  extends BaseController with PanDomainAuthActions with Loggable {

  private val timeout = 30.seconds
  private implicit val executionContext = controllerComponents.executionContext

  def exportAsGitRepo(contentId: String) = AuthAction {
    val snapshotIds = config.sourceStacks.flatMap { stack =>
      snapshotApi.listForId(stack.snapshotBucket, contentId).map(stack -> _)
    }

    if(snapshotIds.isEmpty) {
      NotFound(s"$contentId does not have any snapshots")
    } else {
      val dir = Files.createTempDirectory(s"export-$contentId")
      val repo = Git.init().setDirectory(dir.toFile).call()

      snapshotIds.foreach { case(stack, id @ SnapshotId(_, timestamp)) =>
        val filename = s"${stack.stage}:${stack.stack}.yaml"
        val snapshot = getSnapshot(stack, id)
        val commitTime = Date.from(snapshot.lastModifiedTime.getOrElse(Instant.parse(timestamp)))

        val author = new PersonIdent(new PersonIdent(
          snapshot.lastModifiedName.getOrElse("unknown"),
          snapshot.lastModifiedEmail.getOrElse("unknown")
        ), commitTime)

        Files.write(dir.resolve(filename), snapshot.contents.getBytes(StandardCharsets.UTF_8))
        repo.add().addFilepattern(filename).call()

        repo.commit()
          .setMessage(s"Snapshot update from $timestamp")
          .setAuthor(author)
          .call()
      }

      val zip = zipFolder(contentId, dir)

      Ok.sendPath(zip, onClose = () => {
        FileUtils.deleteDirectory(dir.toFile)
        Files.delete(zip)
      })
    }
  }

  private def getSnapshot(stack: FlexibleStack, id: SnapshotId): FormattedSnapshot = {
    Await.result(snapshotApi.getRawSnapshot(stack.snapshotBucket, id).asFuture(controllerComponents.executionContext), timeout) match {
      case Left(err) =>
        throw new IllegalStateException(err.toString)

      case Right(None) =>
        throw new IllegalStateException(s"Missing snapshot for $stack $id")

      case Right(Some(snapshot)) =>
        FormattedSnapshot(snapshot)
    }
  }

  private def zipFolder(contentId: String, folder: Path): Path = {
    val zipPath = Files.createTempFile(s"export-zip-$contentId", ".zip")

    val fileOut = new FileOutputStream(zipPath.toFile)
    val zipOut = new ZipOutputStream(fileOut)

    Files.walkFileTree(folder, new SimpleFileVisitor[Path] {
      override def visitFile(file: Path, attrs: BasicFileAttributes): FileVisitResult = {
        zipOut.putNextEntry(new ZipEntry(folder.relativize(file).toString))
        Files.copy(file, zipOut)
        zipOut.closeEntry()

        FileVisitResult.CONTINUE
      }

      override def preVisitDirectory(dir: Path, attrs: BasicFileAttributes): FileVisitResult = {
        zipOut.putNextEntry(new ZipEntry(s"${folder.relativize(dir)}/"))
        zipOut.closeEntry()

        FileVisitResult.CONTINUE
      }
    })

    zipOut.close()
    fileOut.close()

    zipPath
  }
}

case class FormattedSnapshot(lastModifiedTime: Option[Instant], lastModifiedEmail: Option[String],
                             lastModifiedName: Option[String], contents: String)
object FormattedSnapshot {
  def apply(rawSnapshot: String): FormattedSnapshot = {
    val json = new ObjectMapper().readTree(rawSnapshot)
    val yaml = new YAMLMapper().writeValueAsString(json)

    val lastModifiedTime = metaField(json,"date") { n => Instant.ofEpochMilli(n.asLong()) }
    val email = metaField(json,"user/email")(_.asText())

    val firstName = metaField(json,"user/firstName")(_.asText())
    val lastName = metaField(json,"user/lastName")(_.asText())
    val name = if(firstName.isEmpty && lastName.isEmpty) {
      None
    } else {
      Some(firstName.getOrElse("") + " " + lastName.getOrElse(""))
    }

    // TODO MRB: prettify html in text fields
    FormattedSnapshot(lastModifiedTime, email, name, yaml)
  }

  private def metaField[T](json: JsonNode, field: String)(fn: JsonNode => T): Option[T] = {
    val node = json.at(s"/contentChangeDetails/lastModified/$field")

    if(node.isMissingNode) {
      None
    } else {
      Some(fn(node))
    }
  }
}
