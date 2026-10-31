package ai.openverse.mobile

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        setupWebViewSettings()
        setupWebViewClients()

        // Handle initial launch intent if containing deep link
        handleIntent(intent)

        // Load bundled mobile application assets
        webView.loadUrl("file:///android_asset/index.html")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebViewSettings() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // User Agent enhancement
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
                    // Open external links in device browser
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Check if pending deep link needs to be delivered
                pendingDeepLinkUrl?.let {
                    dispatchDeepLinkToWeb(it)
                    pendingDeepLinkUrl = null
                }
            }
        }

        webView.webChromeClient = WebChromeClient()
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
