package controllers

import java.nio.charset.StandardCharsets
import java.nio.file.Files

import com.gu.pandomainauth.PanDomainAuthSettingsRefresher
import config.RestorerConfig
import helpers.Loggable
import logic.SnapshotApi
import models.{FlexibleStack, SnapshotId}
import play.api.libs.ws.WSClient
import play.api.mvc.{BaseController, ControllerComponents}

import scala.concurrent.Await
import scala.concurrent.duration._

class Export(snapshotApi: SnapshotApi, override val controllerComponents: ControllerComponents, override val config: RestorerConfig,
             override val wsClient: WSClient, val panDomainSettings: PanDomainAuthSettingsRefresher)

  extends BaseController with PanDomainAuthActions with Loggable {

  private val timeout = 30.seconds

  def exportAsGitRepo(contentId: String) = AuthAction {
    val snapshotIds = config.sourceStacks.flatMap { stack =>
      snapshotApi.listForId(stack.snapshotBucket, contentId).map(stack -> _)
    }

    if(snapshotIds.isEmpty) {
      NotFound(s"$contentId does not have any snapshots")
    } else {
      // TODO MRB: delete directory once download complete
      val dir = Files.createTempDirectory(s"export-$contentId")

      snapshotIds.foreach { case(stack, id @ SnapshotId(_, timestamp)) =>
        val filename = s"$stack-$timestamp"
        val snapshot = getSnapshot(stack, id)
        Files.write(dir.resolve(filename), snapshot.getBytes(StandardCharsets.UTF_8))
      }

      Ok(dir.toString)
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
}
