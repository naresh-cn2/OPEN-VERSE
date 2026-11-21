package ai.openverse.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class PackageReplacedReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "OPEN-VERSE-Update"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            try {
                val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    context.packageManager.getPackageInfo(context.packageName, android.content.pm.PackageManager.PackageInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    context.packageManager.getPackageInfo(context.packageName, 0)
                }
                val vName = pInfo.versionName ?: "unknown"
                val vCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pInfo.longVersionCode else @Suppress("DEPRECATION") pInfo.versionCode.toLong()
                Log.i(TAG, "Application successfully replaced/upgraded to v$vName ($vCode)")

                val prefs = context.getSharedPreferences("openverse_update_prefs", Context.MODE_PRIVATE)
                prefs.edit()
                    .putString("last_installed_version_name", vName)
                    .putLong("last_installed_version_code", vCode)
                    .putLong("update_installed_at", System.currentTimeMillis())
                    .apply()
            } catch (e: Exception) {
                Log.e(TAG, "Error in PackageReplacedReceiver", e)
            }
        }
    }
}

