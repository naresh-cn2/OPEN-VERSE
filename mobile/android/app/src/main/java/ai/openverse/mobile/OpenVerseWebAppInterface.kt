package ai.openverse.mobile

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

class OpenVerseWebAppInterface(private val context: Context) {

    companion object {
        private const val TAG = "OPEN-VERSE-NativeBridge"
        const val UPDATE_PREFS = "openverse_update_prefs"
        const val KEY_PENDING_APK = "pending_update_apk_path"
        const val KEY_PENDING_VERSION = "pending_update_version"
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            pInfo.versionName ?: "0.2.3"
        } catch (e: Exception) {
            Log.w(TAG, "Failed to read installed package versionName", e)
            "0.2.3"
        }
    }

    @JavascriptInterface
    fun getAppVersionCode(): Long {
        return try {
            val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                pInfo.versionCode.toLong()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to read installed package versionCode", e)
            5L
        }
    }

    @JavascriptInterface
    fun canInstallPackages(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    @JavascriptInterface
    fun requestInstallPackagesPermission(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                true
            } else {
                true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch unknown sources settings", e)
            false
        }
    }

    @JavascriptInterface
    fun getDeviceDetails(): String {
        return "{\"model\":\"${Build.MANUFACTURER} ${Build.MODEL}\",\"osVersion\":\"Android ${Build.VERSION.RELEASE}\",\"sdkInt\":${Build.VERSION.SDK_INT},\"versionName\":\"${getAppVersion()}\",\"versionCode\":${getAppVersionCode()}}"
    }

    @JavascriptInterface
    fun openExternalUrl(url: String): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            Log.e(TAG, "openExternalUrl failed for $url", e)
            false
        }
    }

    @JavascriptInterface
    fun openApplication(packageName: String): Boolean {
        return try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(launchIntent)
                true
            } else {
                if (packageName.contains("youtube", ignoreCase = true)) {
                    openExternalUrl("https://youtube.com")
                } else {
                    false
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "openApplication failed for $packageName", e)
            false
        }
    }

    @JavascriptInterface
    fun initiatePhoneCall(phoneNumber: String): Boolean {
        return try {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                data = Uri.parse("tel:${Uri.encode(phoneNumber)}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(dialIntent)
            true
        } catch (e: Exception) {
            Log.e(TAG, "initiatePhoneCall failed", e)
            false
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String): Boolean {
        return try {
            mainHandler.post {
                Toast.makeText(context, "$title: $message", Toast.LENGTH_LONG).show()
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        mainHandler.post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun performHapticFeedback(type: String?) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(20)
                }
            }
        } catch (_: Exception) {}
    }

    @JavascriptInterface
    fun downloadAndInstallApk(url: String) {
        downloadAndInstallApkInternal(url, null, 0L)
    }

    @JavascriptInterface
    fun downloadAndInstallApkWithChecksum(url: String, expectedSha256: String, expectedVersionCode: Long) {
        downloadAndInstallApkInternal(url, expectedSha256, expectedVersionCode)
    }

    private fun downloadAndInstallApkInternal(url: String, expectedSha256: String?, expectedVersionCode: Long) {
        Log.i(TAG, "Starting native update download from: $url")
        showToast("Downloading OPEN-VERSE update...")

        Thread {
            try {
                val updatesDir = File(context.cacheDir, "apk_updates")
                if (!updatesDir.exists()) updatesDir.mkdirs()

                // Clean up any stale partial downloads
                updatesDir.listFiles()?.forEach { file ->
                    if (file.name.endsWith(".tmp")) file.delete()
                }

                val tempFile = File(updatesDir, "open-verse-update.tmp")
                val targetFile = File(updatesDir, "open-verse-update.apk")

                if (tempFile.exists()) tempFile.delete()

                val connection = URL(url).openConnection() as HttpURLConnection
                connection.instanceFollowRedirects = true
                connection.connectTimeout = 30_000
                connection.readTimeout = 60_000
                connection.setRequestProperty("User-Agent", "OPEN-VERSE-Mobile-Updater/${getAppVersion()}")
                connection.connect()

                val responseCode = connection.responseCode
                if (responseCode !in 200..299) {
                    throw IllegalStateException("Download failed with HTTP response code: $responseCode")
                }

                val digest = MessageDigest.getInstance("SHA-256")
                val input: InputStream = connection.inputStream
                val output = FileOutputStream(tempFile)

                val buffer = ByteArray(8192)
                var bytesRead: Int
                while (input.read(buffer).also { bytesRead = it } != -1) {
                    digest.update(buffer, 0, bytesRead)
                    output.write(buffer, 0, bytesRead)
                }

                output.flush()
                output.close()
                input.close()
                connection.disconnect()

                val computedHash = digest.digest().joinToString("") { "%02x".format(it) }
                Log.i(TAG, "Download complete. Computed SHA-256: $computedHash")

                // 1. Verify Checksum if provided
                if (!expectedSha256.isNullOrBlank()) {
                    val cleanExpected = expectedSha256.trim().lowercase()
                    if (computedHash.lowercase() != cleanExpected) {
                        tempFile.delete()
                        showToast("Update verification failed: Checksum mismatch.")
                        Log.e(TAG, "Checksum mismatch! Expected: $cleanExpected, Computed: $computedHash")
                        return@Thread
                    }
                    Log.i(TAG, "✓ Checksum verification passed!")
                }

                // Atomic rename to final APK
                if (targetFile.exists()) targetFile.delete()
                if (!tempFile.renameTo(targetFile)) {
                    tempFile.copyTo(targetFile, overwrite = true)
                    tempFile.delete()
                }

                // 2. Verify Package Archive Integrity & Package Name
                val pm = context.packageManager
                val archiveInfo = pm.getPackageArchiveInfo(
                    targetFile.absolutePath,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) PackageManager.GET_SIGNING_CERTIFICATES else @Suppress("DEPRECATION") PackageManager.GET_SIGNATURES
                )

                if (archiveInfo == null) {
                    targetFile.delete()
                    showToast("Downloaded update is not a valid Android package.")
                    Log.e(TAG, "getPackageArchiveInfo returned null for ${targetFile.absolutePath}")
                    return@Thread
                }

                if (archiveInfo.packageName != context.packageName) {
                    targetFile.delete()
                    showToast("Package name mismatch: ${archiveInfo.packageName}")
                    Log.e(TAG, "Package name mismatch! Archive: ${archiveInfo.packageName}, Current: ${context.packageName}")
                    return@Thread
                }

                val archiveVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    archiveInfo.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    archiveInfo.versionCode.toLong()
                }

                val currentCode = getAppVersionCode()
                if (archiveVersionCode < currentCode) {
                    targetFile.delete()
                    showToast("Application is already at a newer version ($currentCode > $archiveVersionCode).")
                    Log.w(TAG, "Archive versionCode ($archiveVersionCode) is older than installed ($currentCode). Aborting.")
                    return@Thread
                }
                if (archiveVersionCode == currentCode) {
                    showToast("OPEN-VERSE v${archiveInfo.versionName ?: getAppVersion()} is already up to date.")
                    Log.i(TAG, "Application is already at this version ($currentCode == $archiveVersionCode).")
                    targetFile.delete()
                    return@Thread
                }

                // 3. Verify Signing Certificates
                if (!verifyPackageSignature(targetFile)) {
                    targetFile.delete()
                    showToast("Update signature mismatch. Aborting.")
                    return@Thread
                }

                Log.i(TAG, "✓ Package verification succeeded! Archive versionCode: $archiveVersionCode, versionName: ${archiveInfo.versionName}")

                // 4. Check Unknown App Sources Permission
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
                    // Save pending APK so we can launch it when permission is granted
                    val prefs = context.getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
                    prefs.edit()
                        .putString(KEY_PENDING_APK, targetFile.absolutePath)
                        .putString(KEY_PENDING_VERSION, archiveInfo.versionName ?: "")
                        .apply()

                    mainHandler.post {
                        Toast.makeText(context, "Please allow OPEN-VERSE to install updates, then return here.", Toast.LENGTH_LONG).show()
                        val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                            data = Uri.parse("package:${context.packageName}")
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        context.startActivity(intent)
                    }
                    return@Thread
                }

                // 5. Launch Native Package Installer with FileProvider Content URI
                launchApkInstaller(targetFile)

            } catch (e: Exception) {
                Log.e(TAG, "Native APK update error: ${e.message}", e)
                showToast("Update error: ${e.message ?: "Failed to install update"}")
                // Fallback to opening browser link if native direct download fails
                openExternalUrl(url)
            }
        }.start()
    }

    private fun verifyPackageSignature(archiveFile: File): Boolean {
        return try {
            val pm = context.packageManager
            val installedInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES)
            }

            val archiveInfo = pm.getPackageArchiveInfo(
                archiveFile.absolutePath,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) PackageManager.GET_SIGNING_CERTIFICATES else @Suppress("DEPRECATION") PackageManager.GET_SIGNATURES
            ) ?: return false

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val installedSigning = installedInfo.signingInfo ?: return true
                val archiveSigning = archiveInfo.signingInfo ?: return true
                val installedSigs = if (installedSigning.hasMultipleSigners()) installedSigning.apkContentsSigners else installedSigning.signingCertificateHistory
                val archiveSigs = if (archiveSigning.hasMultipleSigners()) archiveSigning.apkContentsSigners else archiveSigning.signingCertificateHistory
                if (!installedSigs.isNullOrEmpty() && !archiveSigs.isNullOrEmpty()) {
                    val match = installedSigs.any { ins -> archiveSigs.any { arc -> ins == arc } }
                    if (!match) {
                        Log.e(TAG, "Signature mismatch between installed app and update archive")
                        return false
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                val installedSigs = installedInfo.signatures
                @Suppress("DEPRECATION")
                val archiveSigs = archiveInfo.signatures
                if (!installedSigs.isNullOrEmpty() && !archiveSigs.isNullOrEmpty()) {
                    val match = installedSigs.any { ins -> archiveSigs.any { arc -> ins == arc } }
                    if (!match) {
                        Log.e(TAG, "Signature mismatch between installed app and update archive")
                        return false
                    }
                }
            }
            true
        } catch (e: Exception) {
            Log.w(TAG, "Signature check warning: ${e.message} (allowing installer validation)")
            true
        }
    }

    fun launchApkInstaller(apkFile: File) {
        try {
            val apkUri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                clipData = android.content.ClipData.newRawUri("OPEN-VERSE Update", apkUri)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_GRANT_READ_URI_PERMISSION or
                        Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
            }

            // Explicitly grant read uri permission to system package installer packages
            val installerPackages = listOf(
                "com.google.android.packageinstaller",
                "com.android.packageinstaller",
                "com.google.android.permissioncontroller"
            )
            for (pkg in installerPackages) {
                try {
                    context.grantUriPermission(pkg, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                } catch (_: Exception) {}
            }

            // Also grant to any resolving package
            try {
                val resolvedList = context.packageManager.queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY)
                for (resolveInfo in resolvedList) {
                    try {
                        context.grantUriPermission(resolveInfo.activityInfo.packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    } catch (_: Exception) {}
                }
            } catch (_: Exception) {}

            Log.i(TAG, "Launching Android PackageInstaller intent with URI: $apkUri")
            context.startActivity(installIntent)

            // Clear pending update state now that installer has launched
            val prefs = context.getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
            prefs.edit().remove(KEY_PENDING_APK).remove(KEY_PENDING_VERSION).apply()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch package installer", e)
            showToast("Failed to launch package installer: ${e.message}")
        }
    }
}
