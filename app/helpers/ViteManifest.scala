package helpers

import controllers.routes
import play.api.{Environment, Mode}
import play.api.libs.json.{JsValue, Json}
import play.twirl.api.Html

import scala.util.Using

/** Resolves the client bundle produced by `vite build`.
  *
  * In production the entry module is looked up in Vite's manifest.json so the
  * content-hashed filenames (and the chunks/CSS it depends on) can be injected
  * into the page. When `devServerBase` is set, the manifest is bypassed and the
  * running Vite dev server is used instead, giving hot-module reloading.
  */
class ViteManifest(devServerBase: Option[String], environment: Environment) {

  import ViteManifest._

  // The watch build rewrites the manifest with new hashed names on every source
  // change, so in dev it must be re-read per render; in prod it is immutable.
  private lazy val cachedManifest: Map[String, JsValue] = loadManifest()

  private def manifest: Map[String, JsValue] =
    if (environment.mode == Mode.Dev) loadManifest() else cachedManifest

  private def loadManifest(): Map[String, JsValue] =
    environment
      .resourceAsStream(ManifestResource)
      .map(stream =>
        Using.resource(stream)(Json.parse(_).as[Map[String, JsValue]])
      )
      .getOrElse(
        throw new IllegalStateException(
          s"Vite manifest not found on the classpath at $ManifestResource. " +
            "Run `npm run build` before packaging the app."
        )
      )

  private def entry: JsValue =
    manifest.getOrElse(
      EntryKey,
      throw new IllegalStateException(
        s"Entry '$EntryKey' is missing from the Vite manifest."
      )
    )

  // Vite already content-hashes every filename, so with the sbt-digest pipeline
  // removed `Assets.versioned` no longer fingerprints and simply serves the file
  // (returning the pre-compressed `.gz`/`.br` sibling when the client accepts it).
  private def assetUrl(file: String): String =
    routes.Assets.versioned(s"dist/$file").url

  /** `<link rel="icon">` for the favicon, resolved from the manifest. */
  def favicon: Html = devServerBase match {
    case Some(base) =>
      Html(s"""<link rel="icon" type="image/png" href="$base/$FaviconKey">""")
    case None =>
      val file = manifest
        .get(FaviconKey)
        .flatMap(entry => (entry \ "file").asOpt[String])
        .getOrElse(
          throw new IllegalStateException(
            s"Favicon '$FaviconKey' is missing from the Vite manifest."
          )
        )
      Html(s"""<link rel="icon" type="image/png" href="${assetUrl(file)}">""")
  }

  /** Stylesheet `<link>` tags for the entry and its imported chunks. */
  def stylesheets: Html = devServerBase match {
    case Some(_) =>
      Html("") // the dev server injects styles over the HMR socket
    case None =>
      Html(
        cssFiles
          .map(href => s"""<link rel="stylesheet" href="${assetUrl(href)}">""")
          .mkString("\n")
      )
  }

  /** Module `<script>` tags (with preload hints) for the entry bundle. */
  def scripts: Html = devServerBase match {
    case Some(base) =>
      // The React Refresh preamble must be installed before any module loads for
      // @vitejs/plugin-react's fast refresh to work when Play (not Vite) serves
      // the HTML. See the plugin's "backend integration" docs.
      Html(
        s"""<script type="module">
           |  import RefreshRuntime from '$base/@react-refresh'
           |  RefreshRuntime.injectIntoGlobalHook(window)
           |  window.$$RefreshReg$$ = () => {}
           |  window.$$RefreshSig$$ = () => (type) => type
           |  window.__vite_plugin_react_preamble_installed__ = true
           |</script>
           |<script type="module" src="$base/@vite/client"></script>
           |<script type="module" src="$base/$EntryKey"></script>""".stripMargin
      )
    case None =>
      val entryFile = (entry \ "file").as[String]
      val preloads = importedChunkFiles.map(file =>
        s"""<link rel="modulepreload" href="${assetUrl(file)}">"""
      )
      val entryTag =
        s"""<script type="module" src="${assetUrl(entryFile)}"></script>"""
      Html((preloads :+ entryTag).mkString("\n"))
  }

  // CSS emitted by the entry plus any CSS pulled in by its imported chunks.
  private def cssFiles: Seq[String] = {
    val fromEntry = (entry \ "css").asOpt[Seq[String]].getOrElse(Nil)
    val fromImports = importedChunkKeys.flatMap(key =>
      (manifest
        .get(key)
        .toSeq
        .flatMap(chunk => (chunk \ "css").asOpt[Seq[String]].getOrElse(Nil)))
    )
    (fromEntry ++ fromImports).distinct
  }

  // Keys of every chunk the entry depends on, resolved transitively.
  private def importedChunkKeys: Seq[String] = {
    def resolve(keys: Seq[String], seen: Set[String]): Set[String] =
      keys.foldLeft(seen) { (acc, key) =>
        if (acc.contains(key)) acc
        else {
          val next = manifest
            .get(key)
            .toSeq
            .flatMap(c => (c \ "imports").asOpt[Seq[String]].getOrElse(Nil))
          resolve(next, acc + key)
        }
      }

    val direct = (entry \ "imports").asOpt[Seq[String]].getOrElse(Nil)
    resolve(direct, Set.empty).toSeq
  }

  private def importedChunkFiles: Seq[String] =
    importedChunkKeys.flatMap(key =>
      manifest.get(key).flatMap(c => (c \ "file").asOpt[String])
    )
}

object ViteManifest {
  // Vite writes the manifest inside outDir (public/dist); Play exposes the
  // public/ tree on the classpath, so it is read as /public/dist/manifest.json.
  private val ManifestResource = "/public/dist/manifest.json"

  // The rollup input configured in vite.config.ts, keyed relative to project root.
  private val EntryKey = "public/src/app/main.tsx"

  // The favicon rollup input in vite.config.ts, keyed relative to project root.
  private val FaviconKey = "public/images/fav-versions-32.png"
}
