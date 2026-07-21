package expo.modules.statusaccess

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import androidx.documentfile.provider.DocumentFile
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

private const val PREFS = "statusly_status_access"
private const val OPEN_TREE_REQUEST = 0x57414142 // "WAAB"
private const val EXTERNAL_STORAGE_AUTHORITY = "com.android.externalstorage.documents"

/** Per-source configuration. Paths kept here so WhatsApp folder changes are localized. */
private data class SourceConfig(val initialDocId: String, val prefKey: String)

private val SOURCES = mapOf(
  "whatsapp" to SourceConfig(
    initialDocId = "primary:Android/media/com.whatsapp/WhatsApp/Media/.Statuses",
    prefKey = "tree_whatsapp",
  ),
  "business" to SourceConfig(
    initialDocId = "primary:Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses",
    prefKey = "tree_business",
  ),
)

class StatusAccessModule : Module() {
  private var pendingPromise: Promise? = null
  private var pendingSource: String? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("StatusAccess")

    AsyncFunction("hasAccess") { source: String ->
      hasAccess(source)
    }

    AsyncFunction("requestStatusFolderAccess") { source: String, promise: Promise ->
      requestAccess(source, promise)
    }

    AsyncFunction("listStatuses") { source: String ->
      listStatuses(source)
    }

    AsyncFunction("cacheStatus") { uri: String ->
      cacheStatus(uri)
    }

    AsyncFunction("shareMultiple") { paths: List<String>, mime: String ->
      shareMultiple(paths, mime)
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != OPEN_TREE_REQUEST) {
        return@OnActivityResult
      }
      val promise = pendingPromise
      val source = pendingSource
      pendingPromise = null
      pendingSource = null
      if (promise == null || source == null) {
        return@OnActivityResult
      }

      val treeUri = payload.data?.data
      if (payload.resultCode != Activity.RESULT_OK || treeUri == null) {
        promise.resolve(mapOf("granted" to false, "treeUri" to ""))
        return@OnActivityResult
      }

      val takeFlags = (payload.data?.flags ?: 0) and
        (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
      try {
        context.contentResolver.takePersistableUriPermission(
          treeUri,
          if (takeFlags == 0) Intent.FLAG_GRANT_READ_URI_PERMISSION else takeFlags,
        )
      } catch (e: SecurityException) {
        promise.resolve(mapOf("granted" to false, "treeUri" to ""))
        return@OnActivityResult
      }
      storeTreeUri(source, treeUri.toString())
      promise.resolve(mapOf("granted" to true, "treeUri" to treeUri.toString()))
    }
  }

  // -- SAF grant ------------------------------------------------------------

  private fun requestAccess(source: String, promise: Promise) {
    val config = configFor(source)
    val activity = appContext.currentActivity
      ?: run {
        promise.reject(CodedException("No current activity to launch the folder picker"))
        return
      }
    if (pendingPromise != null) {
      promise.reject(CodedException("A folder access request is already in progress"))
      return
    }

    pendingPromise = promise
    pendingSource = source

    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
      addFlags(
        Intent.FLAG_GRANT_READ_URI_PERMISSION or
          Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION,
      )
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val initialUri = DocumentsContract.buildDocumentUri(
          EXTERNAL_STORAGE_AUTHORITY,
          config.initialDocId,
        )
        putExtra(DocumentsContract.EXTRA_INITIAL_URI, initialUri)
      }
    }

    try {
      activity.startActivityForResult(intent, OPEN_TREE_REQUEST)
    } catch (e: Exception) {
      pendingPromise = null
      pendingSource = null
      promise.reject(CodedException("Could not open the folder picker", e))
    }
  }

  // -- Access check ---------------------------------------------------------

  private fun hasAccess(source: String): Boolean {
    val stored = getStoredTreeUri(source) ?: return false
    val uri = Uri.parse(stored)
    val persisted = context.contentResolver.persistedUriPermissions.any {
      it.uri == uri && it.isReadPermission
    }
    if (!persisted) {
      return false
    }
    val dir = DocumentFile.fromTreeUri(context, uri)
    return dir != null && dir.canRead()
  }

  // -- Listing --------------------------------------------------------------

  private fun listStatuses(source: String): List<Map<String, Any?>> {
    val stored = getStoredTreeUri(source)
      ?: throw CodedException("No folder access granted for source: $source")
    val uri = Uri.parse(stored)
    val dir = DocumentFile.fromTreeUri(context, uri)
      ?: throw CodedException("Status folder is not accessible")
    if (!dir.canRead()) {
      throw CodedException("Read permission for the status folder was revoked")
    }

    return dir.listFiles()
      .asSequence()
      .filter { it.isFile }
      .mapNotNull { file ->
        val mime = file.type ?: return@mapNotNull null
        val kind = when {
          mime.startsWith("image/") -> "image"
          mime.startsWith("video/") -> "video"
          else -> return@mapNotNull null
        }
        mapOf(
          "uri" to file.uri.toString(),
          "name" to (file.name ?: ""),
          "mime" to mime,
          "sizeBytes" to file.length(),
          "lastModified" to file.lastModified(),
          "type" to kind,
        )
      }
      .sortedByDescending { it["lastModified"] as Long }
      .toList()
  }

  // -- Caching for share / repost -------------------------------------------

  private fun cacheStatus(uriString: String): String {
    val uri = Uri.parse(uriString)
    val name = queryDisplayName(uri) ?: "status_${System.currentTimeMillis()}"
    val dir = File(context.cacheDir, "statuses").apply { mkdirs() }
    val out = File(dir, name)

    context.contentResolver.openInputStream(uri).use { input ->
      if (input == null) {
        throw CodedException("Could not open status file: $uriString")
      }
      out.outputStream().use { output -> input.copyTo(output) }
    }
    return Uri.fromFile(out).toString()
  }

  private fun queryDisplayName(uri: Uri): String? {
    return context.contentResolver
      .query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
      ?.use { cursor ->
        if (cursor.moveToFirst()) cursor.getString(0) else null
      }
  }

  // -- Batch share ----------------------------------------------------------

  /** Shares several cached files at once via ACTION_SEND_MULTIPLE. */
  private fun shareMultiple(paths: List<String>, mime: String) {
    val activity = appContext.currentActivity
      ?: throw CodedException("No current activity to open the share sheet")
    val authority = "${context.packageName}.statusprovider"
    val uris = ArrayList<Uri>(paths.size)
    for (raw in paths) {
      val filePath = Uri.parse(raw).path ?: raw
      uris.add(FileProvider.getUriForFile(context, authority, File(filePath)))
    }

    val intent = Intent(Intent.ACTION_SEND_MULTIPLE).apply {
      type = mime
      putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
      addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    activity.startActivity(Intent.createChooser(intent, "Share statuses"))
  }

  // -- Persistence ----------------------------------------------------------

  private fun configFor(source: String): SourceConfig =
    SOURCES[source] ?: throw CodedException("Unknown status source: $source")

  private fun prefs() = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun storeTreeUri(source: String, uri: String) {
    prefs().edit().putString(configFor(source).prefKey, uri).apply()
  }

  private fun getStoredTreeUri(source: String): String? =
    prefs().getString(configFor(source).prefKey, null)
}
