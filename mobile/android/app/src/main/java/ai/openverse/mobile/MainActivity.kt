package ai.openverse.mobile

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    companion object {
        private const val TAG = "OPEN-VERSE-Native"
        private const val ASSET_DOMAIN = "appassets.androidplatform.net"
        private const val ASSET_URL = "https://$ASSET_DOMAIN/index.html"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize AndroidX WebViewAssetLoader for secure origin & CORS compliance
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(ASSET_DOMAIN)
            .addPathHandler("/assets/", AssetsPathHandler(this))
            .addPathHandler("/_next/", AssetsPathHandler(this))
            .addPathHandler("/", AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            // Dark background prevents white flash during view creation
            setBackgroundColor(0xFF09090B.toInt())
        }
        setContentView(webView)

        setupWebViewSettings()
        setupWebViewClients()

        // Handle initial launch intent if containing deep link
        handleIntent(intent)

        Log.i(TAG, "Launching OPEN-VERSE mobile via AssetLoader: $ASSET_URL")
        webView.loadUrl(ASSET_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebViewSettings() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true

        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = true

        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Enhance User Agent with OPEN-VERSE signature
        val defaultUserAgent = settings.userAgentString
        settings.userAgentString = "$defaultUserAgent OPEN-VERSE-Mobile/0.2.0"

        // Register Native JavaScript Bridge
        webView.addJavascriptInterface(OpenVerseWebAppInterface(this), "AndroidInterface")
    }

    private fun setupWebViewClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("openverse://")) {
                    dispatchDeepLinkToWeb(url)
                    return true
                }
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    // Keep appassets requests internal to the webview
                    if (request.url?.host == ASSET_DOMAIN) {
                        return false
                    }
                    // External links open in device browser
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to launch external browser for $url", e)
                    }
                    return true
                }
                return false
            }

            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return null
                val scheme = url.scheme
                val host = url.host

                // 1. Intercept virtual HTTPS domain for assets
                if (scheme == "https" && host == ASSET_DOMAIN) {
                    val response = assetLoader.shouldInterceptRequest(url)
                    if (response != null) {
                        return response
                    }

                    // Direct asset open fallback if path handler leaves any gaps
                    val path = url.path?.removePrefix("/") ?: ""
                    try {
                        val assetPath = if (path.isEmpty()) "index.html" else path
                        val inputStream = assets.open(assetPath)
                        val mimeType = when {
                            assetPath.endsWith(".html") -> "text/html"
                            assetPath.endsWith(".js") -> "application/javascript"
                            assetPath.endsWith(".css") -> "text/css"
                            assetPath.endsWith(".json") -> "application/json"
                            assetPath.endsWith(".png") -> "image/png"
                            assetPath.endsWith(".svg") -> "image/svg+xml"
                            assetPath.endsWith(".txt") -> "text/plain"
                            else -> "application/octet-stream"
                        }
                        return WebResourceResponse(mimeType, "UTF-8", inputStream)
                    } catch (e: Exception) {
                        Log.d(TAG, "Asset not found via direct open: $path")
                    }
                }

                // 2. Intercept legacy file:///android_asset/ if requested
                val urlString = url.toString()
                if (urlString.startsWith("file:///android_asset/")) {
                    val relativePath = urlString.removePrefix("file:///android_asset/")
                    val virtualUri = Uri.parse("https://$ASSET_DOMAIN/assets/$relativePath")
                    val response = assetLoader.shouldInterceptRequest(virtualUri)
                    if (response != null) {
                        return response
                    }
                }

                return super.shouldInterceptRequest(view, request)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                val failingUrl = request?.url?.toString() ?: ""
                val errorDesc = error?.description?.toString() ?: "Unknown error"
                val errorCode = error?.errorCode ?: 0
                Log.e(TAG, "WebView load error [$errorCode] on $failingUrl: $errorDesc")

                if (request?.isForMainFrame == true) {
                    val escaped = errorDesc.replace("'", "\\'")
                    view?.post {
                        view.evaluateJavascript("if (window.__showDiagnosticError) { window.__showDiagnosticError('$escaped ($errorCode)', '$failingUrl'); }", null)
                    }
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.i(TAG, "WebView page finished loading: $url")
                // Check if pending deep link needs to be delivered
                pendingDeepLinkUrl?.let {
                    dispatchDeepLinkToWeb(it)
                    pendingDeepLinkUrl = null
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                val msg = consoleMessage?.message() ?: ""
                val src = consoleMessage?.sourceId() ?: ""
                val line = consoleMessage?.lineNumber() ?: 0
                val level = consoleMessage?.messageLevel() ?: ConsoleMessage.MessageLevel.LOG

                when (level) {
                    ConsoleMessage.MessageLevel.ERROR -> {
                        Log.e("OPEN-VERSE-JS", "[$src:$line] $msg")
                        val escaped = msg.replace("'", "\\'").replace("\n", "\\n")
                        webView.post {
                            webView.evaluateJavascript("if (window.__showDiagnosticError) { window.__showDiagnosticError('$escaped', '$src:$line'); }", null)
                        }
                    }
                    ConsoleMessage.MessageLevel.WARNING -> Log.w("OPEN-VERSE-JS", "[$src:$line] $msg")
                    else -> Log.d("OPEN-VERSE-JS", "[$src:$line] $msg")
                }
                return true
            }
        }
    }

    private var pendingDeepLinkUrl: String? = null

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val data: Uri? = intent?.data
        if (data != null && data.scheme == "openverse") {
            val deepLinkString = data.toString()
            Log.i(TAG, "Received deep link intent: $deepLinkString")
            dispatchDeepLinkToWeb(deepLinkString)
        }
    }

    private fun dispatchDeepLinkToWeb(url: String) {
        val escapedUrl = url.replace("'", "\\'")
        val js = "if (window.dispatchNativeDeepLink) { window.dispatchNativeDeepLink('$escapedUrl'); }"
        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
