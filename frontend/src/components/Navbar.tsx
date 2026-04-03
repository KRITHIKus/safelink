import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Target,
  Menu,
  X,
  Sun,
  Moon,
  Activity,
  Wifi,
  WifiOff,
  Database,
  Shield,
  Loader,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useSystemStatus } from "../context/SystemStatusContext";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/all-scans", label: "Scans" },
  { path: "/about", label: "About" },
];

const Navbar = () => {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const { status, latencyMs, scanCount } = useSystemStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  // Build ticker items dynamically based on real status
  const statusColor =
    status === "online" ? "var(--safe)" :
    status === "offline" ? "var(--threat)" :
    "var(--warn)";

  const statusLabel =
    status === "online" ? "ONLINE" :
    status === "offline" ? "OFFLINE" :
    "CHECKING";

  const tickerItems = [
    {
      icon: status === "online" ? <Wifi size={10} /> : status === "offline" ? <WifiOff size={10} /> : <Loader size={10} />,
      label: "BACKEND",
      value: statusLabel,
      valueColor: statusColor,
    },
    {
      icon: <Activity size={10} />,
      label: "LATENCY",
      value: latencyMs != null ? `${latencyMs}ms` : "—",
      valueColor: latencyMs != null && latencyMs < 1000 ? "var(--safe)" : latencyMs != null ? "var(--warn)" : "var(--text-tertiary)",
    },
    {
      icon: <Database size={10} />,
      label: "SCAN DB",
      value: scanCount != null ? `${scanCount} records` : "—",
      valueColor: "var(--text-secondary)",
    },
    {
      icon: <Shield size={10} />,
      label: "THREAT ENGINE",
      value: "ACTIVE",
      valueColor: "var(--safe)",
    },
    {
      icon: <Wifi size={10} />,
      label: "VIRUSTOTAL",
      value: "CONNECTED",
      valueColor: "var(--safe)",
    },
  ];

  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <>
      {/* ── System status ticker ─────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-dim)",
          height: "28px",
          overflow: "hidden",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Live backend dot — always visible at left edge */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "0 12px",
            borderRight: "1px solid var(--border-dim)",
            height: "100%",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: statusColor,
              boxShadow: status === "online" ? `0 0 6px ${statusColor}` : "none",
              animation: status === "checking" ? "pulse-accent 1.5s linear infinite" : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: statusColor,
              fontWeight: 500,
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div className="ticker-inner" style={{ padding: "0 24px" }}>
            {tickerContent.map((item, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginRight: "44px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-tertiary)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{item.icon}</span>
                <span>{item.label}</span>
                <span style={{ color: item.valueColor, fontWeight: 500 }}>{item.value}</span>
                <span style={{ color: "var(--border-bright)", margin: "0 4px" }}>/</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main navbar ──────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: "28px",
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "var(--bg-surface)" : "var(--bg-base)",
          borderBottom: "1px solid var(--border-dim)",
          transition: "background 300ms ease-out, border-color 600ms ease-in-out",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "1px solid var(--accent)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              background: "var(--accent-dim)",
            }}
          >
            <Target size={16} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "var(--text-primary)",
            }}
          >
            BULLSEYE
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "3px",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--border-mid)" : "1px solid transparent",
                  transition: "all 150ms linear",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-accent)";
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-glow)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ width: "1px", height: "20px", background: "var(--border-mid)", margin: "0 8px" }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            style={{
              width: "32px",
              height: "32px",
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms linear",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-accent)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)";
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "36px",
            height: "36px",
            background: "transparent",
            border: "1px solid var(--border-mid)",
            borderRadius: "4px",
            color: "var(--text-secondary)",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </nav>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "rgba(5,5,7,0.85)",
          backdropFilter: "blur(8px)",
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden",
          transition: "opacity 250ms ease-out, visibility 250ms ease-out",
        }}
        onClick={closeMenu}
      >
        <div
          style={{
            position: "absolute",
            top: "88px",
            left: "16px",
            right: "16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-mid)",
            borderRadius: "6px",
            padding: "16px",
            transform: isOpen ? "translateY(0)" : "translateY(-12px)",
            transition: "transform 250ms ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* System status in mobile menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              marginBottom: "8px",
              background: "var(--bg-surface)",
              borderRadius: "4px",
              border: "1px solid var(--border-dim)",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: statusColor,
                boxShadow: status === "online" ? `0 0 6px ${statusColor}` : "none",
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: statusColor, fontWeight: 500 }}>
              BACKEND {statusLabel}
            </span>
            {latencyMs != null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", marginLeft: "auto" }}>
                {latencyMs}ms
              </span>
            )}
          </div>

          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  marginBottom: "4px",
                  borderRadius: "4px",
                  fontFamily: "var(--font-display)",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--border-mid)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ height: "1px", background: "var(--border-dim)", margin: "12px 0" }} />

          <button
            onClick={() => { toggleTheme(); closeMenu(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "12px 14px",
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: "4px",
              fontFamily: "var(--font-display)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;