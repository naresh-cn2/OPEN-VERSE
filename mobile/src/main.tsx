import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global bridge handler for Android & iOS native wrappers
const handleDeepLink = (url: string) => {
  window.dispatchEvent(new CustomEvent("openverse:deeplink", { detail: { url } }));
};
(window as any).dispatchNativeDeepLink = handleDeepLink;
(window as any).__dispatchOpenVerseDeepLink = handleDeepLink;

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
