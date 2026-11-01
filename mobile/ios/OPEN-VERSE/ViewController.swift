import UIKit
import WebKit

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
        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "www") {
            let fileUrl = URL(fileURLWithPath: htmlPath)
            webView.loadFileURL(fileUrl, allowingReadAccessTo: fileUrl.deletingLastPathComponent())
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

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("window.__OPENVERSE_MOBILE__ = true; window.__OPENVERSE_PLATFORM__ = 'ios';", completionHandler: nil)
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
}

