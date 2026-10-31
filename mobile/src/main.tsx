import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Global bridge handler for Android & iOS native wrappers
(window as any).dispatchNativeDeepLink = (url: string) => {
  window.dispatchEvent(new CustomEvent("openverse:deeplink", { detail: { url } }));
};

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
