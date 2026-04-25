import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { APP_TAGLINE } from "../lib/constants";
import { RiskAdjustedApySettingsPanel } from "./RiskAdjustedApySettingsPanel";

export function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const sectionLabel = location.pathname.startsWith("/protocols/")
      ? "Platform Analysis"
      : location.pathname.startsWith("/core-assets")
        ? "Core Asset Analysis"
      : location.pathname.startsWith("/tokenized-btc")
        ? "Tokenized BTC Analysis"
      : location.pathname.startsWith("/stablecoins")
        ? "Stablecoin Analysis"
        : "Platform Dashboard";
  const navItems: ReadonlyArray<{ to: string; label: string; end?: boolean }> = [
    { to: "/", label: "Platforms", end: true },
    { to: "/core-assets", label: "Core Assets" },
    { to: "/stablecoins", label: "Stablecoins" },
    { to: "/tokenized-btc", label: "Tokenized BTC" }
  ];

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <NavLink to="/" className="sidebar-title">
            Seer Shield
          </NavLink>
          <p className="sidebar-subtitle">{APP_TAGLINE}</p>
        </div>
        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className="sidebar-link">
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <RiskAdjustedApySettingsPanel compact />
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="topbar-row">
            <div className="topbar-left">
              <button
                className={`mobile-nav-toggle${isMobileNavOpen ? " is-open" : ""}`}
                type="button"
                aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-controls="mobile-primary-navigation"
                aria-expanded={isMobileNavOpen}
                onClick={() => setIsMobileNavOpen((open) => !open)}
              >
                <span />
                <span />
                <span />
              </button>
              <span className="topbar-section">{sectionLabel}</span>
            </div>
            <div className="topbar-right">
              <button
                className="theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                <span aria-hidden="true" className="theme-toggle-icon">
                  {theme === "light" ? "☾" : "☀"}
                </span>
              </button>
            </div>
          </div>
          <nav
            id="mobile-primary-navigation"
            className={`mobile-nav${isMobileNavOpen ? " is-open" : ""}`}
            aria-label="Primary"
          >
            {navItems.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className="mobile-nav-link">
                {label}
              </NavLink>
            ))}
            <RiskAdjustedApySettingsPanel compact />
          </nav>
        </header>
        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
