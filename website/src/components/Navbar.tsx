import React, { useState, useEffect } from "react";
import { Download, Terminal, Menu, X, Smartphone, ShieldCheck, Github } from "lucide-react";

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.25s ease",
        background: isScrolled ? "rgba(9, 9, 11, 0.85)" : "transparent",
        backdropFilter: isScrolled ? "blur(16px)" : "none",
        borderBottom: isScrolled ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
        padding: "16px 0",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Brand Logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img
            src="/robot-icon.svg"
            alt="OPEN-VERSE"
            style={{ width: 34, height: 34, borderRadius: 8 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 900,
                fontSize: "1.15rem",
                letterSpacing: "0.15em",
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              OPEN-VERSE
            </span>
            <span style={{ fontSize: "0.68rem", color: "var(--accent-light)", letterSpacing: "0.08em", fontWeight: 600 }}>
              DESKTOP & MOBILE
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div style={{ display: "none", alignItems: "center", gap: 32 }} className="desktop-nav">
          <a href="#features" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Features
          </a>
          <a href="#how-it-works" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Remote Workflow
          </a>
          <a href="#download" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Downloads
          </a>
          <a href="#docs" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Docs
          </a>
          <a href="#security" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Security
          </a>
          <a href="#releases" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            v0.1.0
          </a>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#download" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
            <Download size={15} />
            <span>Get OPEN-VERSE</span>
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "8px",
              color: "#ffffff",
              cursor: "pointer",
              display: "none",
            }}
            className="mobile-menu-btn"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(18, 18, 23, 0.98)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Remote Workflow</a>
          <a href="#download" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Downloads</a>
          <a href="#docs" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Docs</a>
          <a href="#security" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Security</a>
          <a href="#releases" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "1rem" }}>Releases</a>
        </div>
      )}

      <style>{`
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
};
