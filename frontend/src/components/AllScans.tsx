import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Globe,
  X,
  ChevronRight,
  ExternalLink,
  Database,
  Activity,
  Filter,
  Image,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Expand,
} from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://safelink-backend-3v3n.onrender.com";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface VTData {
  status?: string;
  total_scans?: number;
  malicious_detections?: number;
  last_scan_date?: string;
}

interface Scan {
  _id?: string;
  url: string;
  timestamp?: string;
  virustotal_results?: VTData;
  crawler_results?: {
    title?: string;
    description?: string;
    screenshot_url?: string;
    https?: boolean;
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const truncateUrl = (url: string, max = 48) => {
  try {
    const u = new URL(url);
    const full = u.hostname + u.pathname;
    return full.length > max ? full.slice(0, max) + "…" : full;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
};

const formatDate = (ts?: string) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const getStatus = (scan: Scan): "safe" | "threat" | "unknown" => {
  const det = scan.virustotal_results?.malicious_detections;
  if (det == null) return "unknown";
  return det > 0 ? "threat" : "safe";
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: "safe" | "threat" | "unknown" }) => {
  if (status === "safe") return (
    <span className="badge-safe" style={{ fontSize: "8px", padding: "2px 7px", gap: "4px" }}>
      <CheckCircle2 size={9} /> Safe
    </span>
  );
  if (status === "threat") return (
    <span className="badge-threat" style={{ fontSize: "8px", padding: "2px 7px", gap: "4px" }}>
      <XCircle size={9} /> Threat
    </span>
  );
  return (
    <span className="badge-warn" style={{ fontSize: "8px", padding: "2px 7px", gap: "4px" }}>
      <AlertTriangle size={9} /> Unknown
    </span>
  );
};

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────

const DetailModal = ({
  scan,
  onClose,
}: {
  scan: Scan;
  onClose: () => void;
}) => {
  const status = getStatus(scan);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const ssUrl = scan.crawler_results?.screenshot_url;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(5,5,7,0.75)",
          backdropFilter: "blur(6px)",
          animation: "fade-in-up 150ms ease-out",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "fixed",
          zIndex: 201,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: `1px solid ${status === "threat" ? "var(--threat-border)" : status === "safe" ? "var(--safe-border)" : "var(--border-mid)"}`,
          borderRadius: "8px",
          animation: "fade-in-up 200ms ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "var(--bg-surface)",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {status === "threat"
              ? <ShieldAlert size={16} style={{ color: "var(--threat)", flexShrink: 0 }} />
              : <ShieldCheck size={16} style={{ color: "var(--safe)", flexShrink: 0 }} />
            }
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Scan Details
            </span>
            <StatusBadge status={status} />
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: "28px",
              height: "28px",
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: "4px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px" }}>
          {/* URL */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "6px" }}>
              Target URL
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text-primary)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-dim)",
                borderRadius: "4px",
                padding: "8px 12px",
                wordBreak: "break-all",
                lineHeight: 1.6,
              }}
            >
              {scan.url}
            </div>
          </div>

          {/* VirusTotal data */}
          {scan.virustotal_results && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={10} style={{ color: "#22d3ee" }} /> VirusTotal Intelligence
              </div>
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "4px", overflow: "hidden" }}>
                {[
                  { label: "Verdict", value: scan.virustotal_results.status || (status === "threat" ? "Malicious" : "Clean"), valueColor: status === "threat" ? "var(--threat)" : "var(--safe)" },
                  { label: "Malicious detections", value: String(scan.virustotal_results.malicious_detections ?? 0), valueColor: (scan.virustotal_results.malicious_detections ?? 0) > 0 ? "var(--threat)" : "var(--safe)" },
                  { label: "Total engines", value: String(scan.virustotal_results.total_scans ?? "—") },
                  { label: "Last scan date", value: formatDate(scan.virustotal_results.last_scan_date) },
                ].map((row, i) => (
                  <div key={i} className="data-row" style={{ padding: "8px 12px", margin: 0 }}>
                    <span className="label">{row.label}</span>
                    <span className="value" style={{ color: row.valueColor || "var(--text-primary)", fontWeight: row.valueColor ? 500 : 400 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crawler data */}
          {scan.crawler_results && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Globe size={10} style={{ color: "#a78bfa" }} /> Crawler Recon
              </div>
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)", borderRadius: "4px", overflow: "hidden" }}>
                {[
                  { label: "Page title", value: scan.crawler_results.title || "—" },
                  { label: "HTTPS", value: scan.crawler_results.https !== false ? "Yes" : "No", valueColor: scan.crawler_results.https !== false ? "var(--safe)" : "var(--threat)" },
                  { label: "Description", value: scan.crawler_results.description || "—" },
                ].map((row, i) => (
                  <div key={i} className="data-row" style={{ padding: "8px 12px", margin: 0 }}>
                    <span className="label" style={{ flexShrink: 0 }}>{row.label}</span>
                    <span className="value" style={{ color: row.valueColor || "var(--text-secondary)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scan date */}
          <div className="data-row" style={{ paddingTop: "8px" }}>
            <span className="label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={10} /> Scanned at
            </span>
            <span className="value">{formatDate(scan.timestamp)}</span>
          </div>

          {/* Screenshot — only if URL exists */}
          {ssUrl && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Image size={10} /> Screenshot
              </div>
              <div
                style={{
                  border: "1px solid var(--border-dim)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => setScreenshotOpen(true)}
              >
                <img
                  src={ssUrl}
                  alt="Site screenshot"
                  loading="lazy"
                  style={{ width: "100%", display: "block", maxHeight: "180px", objectFit: "cover", objectPosition: "top" }}
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 50%, rgba(5,5,7,0.7) 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    padding: "8px",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "8px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Expand size={10} /> Expand
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-dim)" }}>
            <a
              href={scan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ fontSize: "9px", flex: 1, justifyContent: "center" }}
            >
              <ExternalLink size={11} /> Open URL
            </a>
            <button onClick={onClose} className="btn-ghost" style={{ fontSize: "9px", flex: 1, justifyContent: "center" }}>
              <X size={11} /> Close
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot fullscreen */}
      {screenshotOpen && ssUrl && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(5,5,7,0.96)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => setScreenshotOpen(false)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              onClick={() => setScreenshotOpen(false)}
              style={{ position: "absolute", top: "-38px", right: 0, background: "transparent", border: "1px solid var(--border-mid)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-display)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em" }}
            >
              <X size={11} /> CLOSE
            </button>
            <img src={ssUrl} alt="Full screenshot" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "6px", border: "1px solid var(--border-mid)", display: "block" }} />
          </div>
        </div>
      )}
    </>
  );
};

// ─── SCAN ROW ─────────────────────────────────────────────────────────────────

const ScanRow = ({ scan, index, onClick }: { scan: Scan; index: number; onClick: () => void }) => {
  const status = getStatus(scan);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr auto auto auto",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-dim)",
        cursor: "pointer",
        background: hovered ? "var(--bg-card-hover)" : "transparent",
        transition: "background 120ms linear",
        animation: `fade-in-up 200ms ease-out ${index * 30}ms both`,
      }}
    >
      {/* Index */}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", textAlign: "right", flexShrink: 0 }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* URL + date */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
          <Globe size={10} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            title={scan.url}
          >
            {truncateUrl(scan.url, 52)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={9} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
            {formatDate(scan.timestamp)}
          </span>
        </div>
      </div>

      {/* Malicious count */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: (scan.virustotal_results?.malicious_detections ?? 0) > 0 ? "var(--threat)" : "var(--text-tertiary)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "3px",
        }}
        title="Malicious detections"
      >
        <ShieldAlert size={9} />
        {scan.virustotal_results?.malicious_detections ?? "—"}
      </span>

      {/* Badge */}
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={status} />
      </div>

      {/* Chevron */}
      <ChevronRight
        size={13}
        style={{
          color: hovered ? "var(--text-accent)" : "var(--text-tertiary)",
          flexShrink: 0,
          transition: "color 120ms linear, transform 120ms linear",
          transform: hovered ? "translateX(2px)" : "translateX(0)",
        }}
      />
    </div>
  );
};

// ─── FILTER PILLS ─────────────────────────────────────────────────────────────

type FilterType = "all" | "safe" | "threat";

const FilterPill = ({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: "var(--font-display)",
      fontSize: "9px",
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "5px 13px",
      borderRadius: "20px",
      border: `1px solid ${active ? "var(--border-bright)" : "var(--border-dim)"}`,
      background: active ? "var(--accent-dim)" : "transparent",
      color: active ? "var(--text-accent)" : "var(--text-tertiary)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      transition: "all 150ms linear",
    }}
  >
    {label}
    {count != null && (
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          padding: "1px 5px",
          borderRadius: "8px",
          background: active ? "rgba(249,115,22,0.2)" : "var(--bg-surface)",
          color: active ? "var(--text-accent)" : "var(--text-tertiary)",
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AllScans = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Scan | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchScans = useCallback(async (f: FilterType = filter) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = `${BACKEND}/db/get-urls-by-status`;
      if (f === "safe") endpoint += "?status=safe";
      else if (f === "threat") endpoint += "?status=malicious";
      const res = await axios.get(endpoint);
      setScans(Array.isArray(res.data) ? res.data : []);
      setLastFetched(new Date());
    } catch {
      setError("Failed to load scan history. Backend may be unavailable.");
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchScans(filter); }, [filter]);

  const counts = {
    all: scans.length,
    safe: scans.filter((s) => getStatus(s) === "safe").length,
    threat: scans.filter((s) => getStatus(s) === "threat").length,
  };

  const displayed = filter === "all" ? scans
    : filter === "safe" ? scans.filter((s) => getStatus(s) === "safe")
    : scans.filter((s) => getStatus(s) === "threat");

  return (
    <>
      <div style={{ paddingTop: "88px", minHeight: "100vh" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px 80px" }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(18px, 4vw, 24px)",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                Scan History
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Database size={11} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {scans.length} records
                  </span>
                </div>
                {lastFetched && (
                  <>
                    <span style={{ color: "var(--border-mid)", fontSize: "10px" }}>·</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={10} style={{ color: "var(--text-tertiary)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                        Updated {lastFetched.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchScans(filter)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--font-display)",
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "8px 14px",
                background: "transparent",
                border: "1px solid var(--border-mid)",
                borderRadius: "4px",
                color: "var(--text-secondary)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                transition: "all 150ms linear",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-accent)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)";
              }}
            >
              <RefreshCw
                size={12}
                style={{ animation: loading ? "radar-sweep 0.8s linear infinite" : "none" }}
              />
              Refresh
            </button>
          </div>

          {/* ── FILTER PILLS ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <Filter size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <FilterPill label="All"    active={filter === "all"}    onClick={() => setFilter("all")}    count={counts.all}    />
            <FilterPill label="Safe"   active={filter === "safe"}   onClick={() => setFilter("safe")}   count={counts.safe}   />
            <FilterPill label="Threat" active={filter === "threat"} onClick={() => setFilter("threat")} count={counts.threat} />
          </div>

          {/* ── TABLE ── */}
          <div
            className="card"
            style={{ overflow: "hidden", padding: 0 }}
          >
            {/* Column header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "20px 1fr auto auto auto",
                gap: "12px",
                padding: "8px 16px",
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--border-dim)",
              }}
            >
              {["#", "Target URL / Time", "Detections", "Status", ""].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "8px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    textAlign: i === 2 ? "center" : i === 3 ? "center" : "left",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Loading state */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "48px 16px" }}>
                <Activity size={14} style={{ color: "var(--accent)", animation: "pulse-accent 1.4s linear infinite" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Fetching scan records...
                </span>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div style={{ padding: "32px 16px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <AlertTriangle size={14} style={{ color: "var(--threat)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                  {error}
                </span>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayed.length === 0 && (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <Database size={24} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  No scan records found
                </p>
              </div>
            )}

            {/* Rows */}
            {!loading && !error && displayed.map((scan, i) => (
              <ScanRow
                key={scan._id || i}
                scan={scan}
                index={i}
                onClick={() => setSelected(scan)}
              />
            ))}
          </div>

          {/* Record count footer */}
          {!loading && displayed.length > 0 && (
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                Showing {displayed.length} record{displayed.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <DetailModal
          scan={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default AllScans;