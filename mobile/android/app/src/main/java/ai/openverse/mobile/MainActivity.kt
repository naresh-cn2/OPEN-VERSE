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
import java.io.InputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
        private const val TAG = "OPEN-VERSE-Native"
        private const val ASSET_DOMAIN = "appassets.androidplatform.net"
        private const val ASSET_URL = "https://$ASSET_DOMAIN/index.html"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            // Dark background prevents white flash during view creation
            setBackgroundColor(0xFF09090B.toInt())
        }
        setContentView(webView)

        setupWebViewSettings()
        setupWebViewClients()

        WebView.setWebContentsDebuggingEnabled(true)

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

        // Register Native JavaScript Bridge before loading URL
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

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.i(TAG, "WebView page started: $url")
                // Inject mobile flags before React script evaluation begins
                view?.evaluateJavascript(
                    "window.__OPENVERSE_MOBILE__ = true; window.__OPENVERSE_PLATFORM__ = 'android';",
                    null
                )
            }

            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return null
                val host = url.host
                val scheme = url.scheme

                // Intercept virtual HTTPS domain for assets
                if (scheme == "https" && host == ASSET_DOMAIN) {
                    var path = url.path?.trimStart('/') ?: ""
                    if (path.isEmpty() || path == "assets" || path == "assets/") {
                        path = "index.html"
                    }
                    if (path.startsWith("assets/")) {
                        path = path.removePrefix("assets/")
                    }

                    try {
                        val inputStream: InputStream = assets.open(path)
                        val mimeType = when {
                            path.endsWith(".html") -> "text/html"
                            path.endsWith(".js") || path.endsWith(".mjs") -> "application/javascript"
                            path.endsWith(".css") -> "text/css"
                            path.endsWith(".json") -> "application/json"
                            path.endsWith(".svg") -> "image/svg+xml"
                            path.endsWith(".png") -> "image/png"
                            path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
                            path.endsWith(".woff2") -> "font/woff2"
                            path.endsWith(".woff") -> "font/woff"
                            path.endsWith(".ttf") -> "font/ttf"
                            path.endsWith(".txt") -> "text/plain"
                            else -> "application/octet-stream"
                        }
                        val headers = mapOf(
                            "Access-Control-Allow-Origin" to "*",
                            "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
                            "Access-Control-Allow-Headers" to "*"
                        )
                        return WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, inputStream)
                    } catch (e: Exception) {
                        // For client-side routes without file extension, fallback to index.html
                        if (!path.contains(".")) {
                            try {
                                val fallbackStream = assets.open("index.html")
                                val headers = mapOf("Access-Control-Allow-Origin" to "*")
                                return WebResourceResponse("text/html", "UTF-8", 200, "OK", headers, fallbackStream)
                            } catch (_: Exception) {}
                        }
                        Log.w(TAG, "Asset not found: $path (${e.message})")
                    }
                }

                // Intercept legacy file:///android_asset/ if requested
                val urlString = url.toString()
                if (urlString.startsWith("file:///android_asset/")) {
                    val relativePath = urlString.removePrefix("file:///android_asset/").trimStart('/')
                    try {
                        val stream = assets.open(relativePath)
                        return WebResourceResponse("application/octet-stream", "UTF-8", stream)
                    } catch (_: Exception) {}
                }

                return super.shouldInterceptRequest(view, request)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                val failingUrl = request?.url?.toString() ?: ""
                val errorDesc = error?.description?.toString() ?: "Unknown error"
                val errorCode = error?.errorCode ?: 0
                Log.e(TAG, "WebView load error [$errorCode] on $failingUrl: $errorDesc")
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.i(TAG, "WebView page finished loading: $url")
                val cleanupJs = """
                    (function() {
                        window.__OPENVERSE_MOBILE__ = true;
                        window.__OPENVERSE_PLATFORM__ = 'android';
                        function removeOrphanOverlays() {
                            var overlays = document.querySelectorAll('main.fixed.inset-0.z-40');
                            for (var i = 0; i < overlays.length; i++) {
                                var el = overlays[i];
                                if (!Object.keys(el).some(function(k) { return k.startsWith('__reactFiber'); })) {
                                    el.remove();
                                }
                            }
                        }
                        removeOrphanOverlays();
                        var observer = new MutationObserver(function() {
                            removeOrphanOverlays();
                        });
                        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
                        setTimeout(function() { observer.disconnect(); }, 15000);
                    })();
                """.trimIndent()
                view?.evaluateJavascript(cleanupJs, null)
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
                    ConsoleMessage.MessageLevel.ERROR -> Log.e("OPEN-VERSE-JS", "[$src:$line] $msg")
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
        val action = intent?.action
        val data = intent?.data
        if (Intent.ACTION_VIEW == action && data != null) {
            val url = data.toString()
            Log.i(TAG, "Received deep link intent: $url")
            if (::webView.isInitialized) {
                dispatchDeepLinkToWeb(url)
            } else {
                pendingDeepLinkUrl = url
            }
        }
    }

    private fun dispatchDeepLinkToWeb(url: String) {
        val escaped = url.replace("'", "\\'")
        val js = """
            if (window.__dispatchOpenVerseDeepLink) {
                window.__dispatchOpenVerseDeepLink('$escaped');
            } else {
                window.location.hash = '$escaped';
            }
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && ::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
