package ai.openverse.mobile

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class OpenVerseWebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun getAppVersion(): String {
        return "0.2.0"
    }

    @JavascriptInterface
    fun openExternalUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @JavascriptInterface
    fun downloadAndInstallApk(url: String) {
        try {
            Toast.makeText(context, "Downloading OPEN-VERSE update...", Toast.LENGTH_SHORT).show()
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setTitle("OPEN-VERSE Mobile Update")
                setDescription("Downloading latest OPEN-VERSE update...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "open-verse-mobile-update.apk")
                setMimeType("application/vnd.android.package-archive")
            }

            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager ?: return
            val downloadId = manager.enqueue(request)

            val onComplete = object : BroadcastReceiver() {
                override fun onReceive(ctxt: Context?, intent: Intent?) {
                    val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) ?: -1L
                    if (id == downloadId) {
                        try {
                            ctxt?.unregisterReceiver(this)
                        } catch (_: Exception) {}

                        try {
                            val downloadFile = File(
                                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                                "open-verse-mobile-update.apk"
                            )
                            val apkUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                FileProvider.getUriForFile(
                                    context,
                                    "${context.packageName}.fileprovider",
                                    downloadFile
                                )
                            } else {
                                Uri.fromFile(downloadFile)
                            }

                            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                                setDataAndType(apkUri, "application/vnd.android.package-archive")
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                            }
                            context.startActivity(installIntent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Failed to start install: ${e.message}", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }

            val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(onComplete, filter, Context.RECEIVER_EXPORTED)
            } else {
                context.registerReceiver(onComplete, filter)
            }
        } catch (e: Exception) {
            openExternalUrl(url)
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
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
}
