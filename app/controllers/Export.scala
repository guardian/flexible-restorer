package controllers

import java.io.{FileOutputStream, StringWriter}
import java.nio.charset.StandardCharsets
import java.nio.file.attribute.BasicFileAttributes
import java.nio.file.{FileVisitResult, Files, Path, SimpleFileVisitor}
import java.time.Instant
import java.util.Date
import java.util.zip.{ZipEntry, ZipOutputStream}

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.{YAMLGenerator, YAMLMapper}
import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotApi
import models.{FlexibleStack, SnapshotId}
import org.apache.commons.io.FileUtils
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.lib.PersonIdent
import org.jsoup.Jsoup
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}
import ujson.{Js, StringRenderer}

import scala.concurrent.Await
import scala.concurrent.duration._
import scala.util.Try

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
        val snapshot = getSnapshot(stack, id)
        val commitTime = Date.from(snapshot.lastModifiedTime)

        val author = new PersonIdent(new PersonIdent(snapshot.lastModifiedName, snapshot.lastModifiedEmail), commitTime)

        write(dir, repo, filename(stack, "metadata"), snapshot.metadata)
        write(dir, repo, filename(stack, "live"), snapshot.live)
        write(dir, repo, filename(stack, "preview"), snapshot.preview)

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

  private def write(dir: Path, repo: Git, filename: String, contents: String) = {
    Files.write(dir.resolve(filename), contents.getBytes(StandardCharsets.UTF_8))
    repo.add().addFilepattern(filename).call()
  }

  private def filename(stack: FlexibleStack, part: String) = {
    s"${stack.stage}:${stack.stack}.$part.yaml"
  }
}

case class FormattedSnapshot(lastModifiedTime: Instant, lastModifiedEmail: String, lastModifiedName: String, metadata: String, preview: String, live: String)
object FormattedSnapshot {
  private val jsonMapper = new ObjectMapper()

  private val yamlMapper = new YAMLMapper()
    .configure(YAMLGenerator.Feature.MINIMIZE_QUOTES, true)

  def apply(rawSnapshot: String): FormattedSnapshot = {
    val json = ujson.read(rawSnapshot)

    val preview = json("preview")
    val live = json("live")

    json.obj.remove("preview")
    json.obj.remove("live")

    val formattedPreview = format(preview)
    val formattedLive = format(live)
    val formattedMeta = format(json)

    val contentChangeDetails = json("contentChangeDetails")("lastModified")
    val lastModifiedTime = Instant.ofEpochMilli(contentChangeDetails("date").num.toLong)
    val email = Try(contentChangeDetails("user")("email").str).getOrElse("unknown")
    val name = Try(s"${contentChangeDetails("user")("firstName").str} ${contentChangeDetails("user")("lastName").str}").getOrElse("unknown")

    FormattedSnapshot(lastModifiedTime, email, name, formattedMeta, formattedPreview, formattedLive)
  }

  private def format(obj: ujson.Js.Value): String = {
    val formatted = ujson.transform(obj, new FormattedHTMLRenderer()).toString
    // YAML doesn't like spaces before newlines. Two backslashes because .replace takes a regex which is not suprising AT ALL
    val oddYamlHacks = formatted.replace(" \\n", "\\n")

    yamlMapper.writeValueAsString(jsonMapper.readTree(oddYamlHacks))
  }
}

class FormattedHTMLRenderer extends StringRenderer {
  override def visitString(s: CharSequence, index: Int): StringWriter = {
    if(s.length() > 0 && s.charAt(0) == '<') {
      val doc = Jsoup.parse(s.toString)
      doc.outputSettings().prettyPrint(true)

      val formatted = doc.body().html()
      super.visitString(formatted, index)
    } else {
      super.visitString(s, index)
    }
  }
}
