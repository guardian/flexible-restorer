package controllers

import java.io.FileOutputStream
import java.nio.charset.StandardCharsets
import java.nio.file.attribute.BasicFileAttributes
import java.nio.file.{FileVisitResult, Files, Path, SimpleFileVisitor}
import java.util.zip.{ZipEntry, ZipOutputStream}

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotApi
import models.{FlexibleStack, SnapshotId}
import org.eclipse.jgit.api.Git
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
      // TODO MRB: delete directory once download complete
      val dir = Files.createTempDirectory(s"export-$contentId")
      val repo = Git.init().setDirectory(dir.toFile).call()

      snapshotIds.foreach { case(stack, id @ SnapshotId(_, timestamp)) =>
        val filename = s"${stack.stage}:${stack.stack}.yaml"
        val snapshot = getSnapshot(stack, id)
        Files.write(dir.resolve(filename), snapshot.getBytes(StandardCharsets.UTF_8))

        repo.add().addFilepattern(filename).call()
        // TODO MRB: set author to lastModified user and use correct timestamp
        repo.commit().setMessage(s"Snapshot update from $timestamp").call()
      }

      val zip = zipFolder(contentId, dir)
      Ok.sendFile(zip.toFile)
    }
  }

  private def getSnapshot(stack: FlexibleStack, id: SnapshotId): String = {
    Await.result(snapshotApi.getRawSnapshot(stack.snapshotBucket, id).asFuture(controllerComponents.executionContext), timeout) match {
      case Left(err) =>
        throw new IllegalStateException(err.toString)

      case Right(None) =>
        throw new IllegalStateException(s"Missing snapshot for $stack $id")

      case Right(Some(snapshot)) =>
        snapshot
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
