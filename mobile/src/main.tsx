import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global bridge handler for Android & iOS native wrappers
(window as any).dispatchNativeDeepLink = (url: string) => {
  window.dispatchEvent(new CustomEvent("openverse:deeplink", { detail: { url } }));
};

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
