import React from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { InteractiveRemoteDemo } from "./components/InteractiveRemoteDemo";
import { DownloadCenter } from "./components/DownloadCenter";
import { ArchitectureSecurity } from "./components/ArchitectureSecurity";
import { DocsSection } from "./components/DocsSection";
import { ReleasesSection } from "./components/ReleasesSection";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Atmosphere Gradients and Matrix Dot Grid */}
      <div className="ambient-grid" />

      {/* Main Content Hierarchy */}
      <Navbar />
      <main>
        <Hero />
        <InteractiveRemoteDemo />
        <DownloadCenter />
        <ArchitectureSecurity />
        <DocsSection />
        <ReleasesSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
