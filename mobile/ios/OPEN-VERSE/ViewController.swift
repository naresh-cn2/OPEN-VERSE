import UIKit
import WebKit

class AssetSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: "OpenVerse", code: 400, userInfo: nil))
            return
        }

        var path = url.path
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }

        guard let resourcePath = Bundle.main.resourcePath else {
            urlSchemeTask.didFailWithError(NSError(domain: "OpenVerse", code: 500, userInfo: nil))
            return
        }

        let filePath = resourcePath + "/www" + path
        if FileManager.default.fileExists(atPath: filePath), let data = try? Data(contentsOf: URL(fileURLWithPath: filePath)) {
            let mimeType: String
            if path.hasSuffix(".html") { mimeType = "text/html" }
            else if path.hasSuffix(".js") { mimeType = "application/javascript" }
            else if path.hasSuffix(".css") { mimeType = "text/css" }
            else if path.hasSuffix(".json") { mimeType = "application/json" }
            else if path.hasSuffix(".svg") { mimeType = "image/svg+xml" }
            else if path.hasSuffix(".png") { mimeType = "image/png" }
            else if path.hasSuffix(".txt") { mimeType = "text/plain" }
            else { mimeType = "application/octet-stream" }

            let response = HTTPURLResponse(
                url: url,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: [
                    "Content-Type": mimeType,
                    "Access-Control-Allow-Origin": "*",
                    "Content-Length": String(data.count)
                ]
            )!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } else {
            urlSchemeTask.didFailWithError(NSError(domain: "OpenVerse", code: 404, userInfo: nil))
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {

    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 9/255, green: 9/255, blue: 11/255, alpha: 1.0)

        setupWebView()
        loadLocalApp()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: Notification.Name("OpenVerseDeepLinkNotification"),
            object: nil
        )
    }

    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        let contentController = WKUserContentController()

        contentController.add(self, name: "openExternalUrl")
        contentController.add(self, name: "performHapticFeedback")
        configuration.userContentController = contentController
        configuration.setURLSchemeHandler(AssetSchemeHandler(), forURLScheme: "appassets")

        webView = WKWebView(frame: view.bounds, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        view.addSubview(webView)
    }

    private func loadLocalApp() {
        if let url = URL(string: "appassets://localhost/index.html") {
            webView.load(URLRequest(url: url))
        }
    }

    @objc private func handleDeepLinkNotification(_ notification: Notification) {
        guard let urlString = notification.userInfo?["url"] as? String else { return }
        let escaped = urlString.replacingOccurrences(of: "'", with: "\\'")
        let js = "if (window.dispatchNativeDeepLink) { window.dispatchNativeDeepLink('\(escaped)'); }"
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "openExternalUrl", let body = message.body as? [String: Any], let urlString = body["url"] as? String, let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        } else if message.name == "performHapticFeedback" {
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
}

