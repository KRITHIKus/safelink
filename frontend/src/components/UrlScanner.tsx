import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Expand,
  Terminal,
  Server,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Lock,
  Wifi,
  WifiOff,
  ChevronRight,
  Eye,
  X,
  Cpu,
  Zap,
} from "lucide-react";
import { useSystemStatus } from "../context/SystemStatusContext";

const BACKEND = "https://safelink-backend-3v3n.onrender.com";
const URL_REGEX = new RegExp(
  "^(https?:\\/\\/)" +
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})" +
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
    "(\\?[;&a-z\\d%_.~+=-]*)?" +
    "(\\#[-a-z\\d_]*)?$",
  "i"
);
const isValidUrl = (u: string) => URL_REGEX.test(u);

type ScanPhase = "idle" | "scanning" | "safe" | "threat" | "partial";

interface ScanResult {
  url: string;
  cached?: boolean;
  execution_time?: number;
  crawler_results?: {
    title?: string;
    description?: string;
    screenshot_url?: string;
    https?: boolean;
  };
}
interface VTResult {
  status?: string;
  total_scans?: number;
  malicious_detections?: number;
  last_scan_date?: string;
}
interface LogEntry { prefix: string; msg: string; ts: number; }

const LOG_SEQ: { prefix: string; msg: string; delay: number }[] = [
  { prefix: "SYS",     msg: "Received target URL — initiating analysis sequence",  delay: 0    },
  { prefix: "SYS",     msg: "URL validation passed — format confirmed",             delay: 420  },
  { prefix: "VT",      msg: "Establishing connection to VirusTotal API",            delay: 900  },
  { prefix: "VT",      msg: "Submitting URL hash for multi-engine analysis",        delay: 1500 },
  { prefix: "VT",      msg: "Querying 90 threat intelligence engines...",           delay: 2200 },
  { prefix: "CRAWLER", msg: "Launching headless Chromium browser agent",            delay: 2800 },
  { prefix: "CRAWLER", msg: "Navigating to target URL",                             delay: 3600 },
  { prefix: "CRAWLER", msg: "Extracting DOM metadata and page structure",           delay: 4400 },
  { prefix: "CRAWLER", msg: "Capturing full-page screenshot",                       delay: 5200 },
  { prefix: "CRAWLER", msg: "Uploading screenshot to CDN",                          delay: 6000 },
  { prefix: "DB",      msg: "Writing scan record to MongoDB",                       delay: 6600 },
  { prefix: "SYS",     msg: "Awaiting consolidated analysis report",                delay: 7200 },
];

// ─── ANIMATED BULLSEYE SVG ───────────────────────────────────────────────────

const BullseyeLogo = ({ size = 120 }: { size?: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 10000), 80);
    return () => clearInterval(id);
  }, []);

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const armDeg = (tick * 3.6) % 360;
  const armX = 80 + 68 * Math.cos(toRad(armDeg));
  const armY = 80 + 68 * Math.sin(toRad(armDeg));
  const trailDeg = armDeg - 60;
  const trailX = 80 + 68 * Math.cos(toRad(trailDeg));
  const trailY = 80 + 68 * Math.sin(toRad(trailDeg));

  const sweepD = `M 80 80 L ${armX.toFixed(2)} ${armY.toFixed(2)} A 68 68 0 0 0 ${trailX.toFixed(2)} ${trailY.toFixed(2)} Z`;

  const blips = [
    { cx: 105, cy: 52,  r: 2.5, color: "var(--accent)", phase: 0  },
    { cx: 58,  cy: 98,  r: 1.8, color: "var(--safe)",   phase: 33 },
    { cx: 118, cy: 88,  r: 2.0, color: "var(--accent)", phase: 17 },
    { cx: 65,  cy: 48,  r: 1.5, color: "var(--safe)",   phase: 60 },
    { cx: 95,  cy: 112, r: 1.8, color: "var(--accent)", phase: 80 },
  ];

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      style={{ overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bsGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.04" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* Outer reference ring */}
      <circle cx="80" cy="80" r="74" fill="none" stroke="var(--border-mid)" strokeWidth="0.5" />

      {/* Degree tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = toRad(i * 30);
        const big = i % 3 === 0;
        return (
          <line
            key={i}
            x1={(80 + (big ? 70 : 72) * Math.cos(a)).toFixed(2)}
            y1={(80 + (big ? 70 : 72) * Math.sin(a)).toFixed(2)}
            x2={(80 + 74 * Math.cos(a)).toFixed(2)}
            y2={(80 + 74 * Math.sin(a)).toFixed(2)}
            stroke="var(--accent)"
            strokeWidth={big ? "1.2" : "0.6"}
            opacity={big ? "0.65" : "0.3"}
          />
        );
      })}

      {/* Inner range rings */}
      {[54, 36, 20].map((r, i) => (
        <circle key={r} cx="80" cy="80" r={r} fill="none"
          stroke="var(--border-dim)" strokeWidth="0.5"
          strokeDasharray={i === 1 ? "3 3" : "none"} />
      ))}

      {/* Crosshairs */}
      <line x1="80" y1="6"   x2="80"  y2="154" stroke="var(--border-dim)" strokeWidth="0.4" />
      <line x1="6"  y1="80"  x2="154" y2="80"  stroke="var(--border-dim)" strokeWidth="0.4" />

      {/* Sweep fill */}
      <path d={sweepD} fill="url(#bsGrad)" opacity="0.25" />

      {/* Sweep arm */}
      <line
        x1="80" y1="80"
        x2={armX.toFixed(2)} y2={armY.toFixed(2)}
        stroke="var(--accent)" strokeWidth="1.5" opacity="0.95"
        strokeLinecap="round"
      />
      {/* Arm tip */}
      <circle cx={armX.toFixed(2)} cy={armY.toFixed(2)} r="2.6"
        fill="var(--accent)" opacity="0.9" />

      {/* Radar blips — flicker with sin */}
      {blips.map((b, i) => {
        const v = Math.sin(((tick + b.phase) * 0.18)) * 0.45 + 0.5;
        return (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r}
            fill={b.color} opacity={v * 0.85 + 0.1} />
        );
      })}

      {/* Bullseye center */}
      <circle cx="80" cy="80" r="8"   fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.6" />
      <circle cx="80" cy="80" r="4"   fill="none" stroke="var(--accent)" strokeWidth="1.0" opacity="0.8" />
      <circle cx="80" cy="80" r="1.8" fill="var(--accent)" />

      {/* Cardinal labels */}
      <text x="80"  y="3"   textAnchor="middle" fontSize="5" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">N</text>
      <text x="157" y="82"  textAnchor="start"  fontSize="5" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">E</text>
      <text x="80"  y="160" textAnchor="middle" fontSize="5" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">S</text>
      <text x="3"   y="82"  textAnchor="end"    fontSize="5" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">W</text>

      {/* Live angle readout */}
      <text x="5" y="14" fontSize="5.5" fill="var(--accent)" opacity="0.7" fontFamily="var(--font-mono)">
        {Math.round(armDeg).toString().padStart(3, "0")}°
      </text>
    </svg>
  );
};

// ─── LIVE SYSTEM EXECUTION ────────────────────────────────────────────────────

const PREFIX_COLORS: Record<string, string> = {
  SYS:     "var(--accent)",
  VT:      "#22d3ee",
  CRAWLER: "#a78bfa",
  DB:      "var(--safe)",
};

interface LiveProps {
  logLines: LogEntry[];
  startMs: number;
  vtDone: boolean;
  crawlerDone: boolean;
  dbDone: boolean;
}

const LiveSystemExecution = ({ logLines, startMs, vtDone, crawlerDone, dbDone }: LiveProps) => {
  const [now, setNow] = useState(Date.now());
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines.length]);

  const elapsed = ((now - startMs) / 1000).toFixed(2);
  const stepCount = logLines.length;

  const steps = [
    { icon: <Terminal size={13} />, label: "URL Received",    sub: "Validation passed",                   done: stepCount > 1,   active: stepCount === 1 },
    { icon: <Wifi size={13} />,     label: "VirusTotal Query", sub: vtDone ? "Report received" : "90 engines active",  done: vtDone,          active: !vtDone && stepCount > 2 },
    { icon: <Server size={13} />,   label: "Crawler Agent",   sub: crawlerDone ? "Screenshot captured" : "Headless browser running", done: crawlerDone,     active: !crawlerDone && stepCount > 5 },
    { icon: <Database size={13} />, label: "Data Storage",    sub: dbDone ? "Write complete" : "Awaiting results",     done: dbDone,          active: !dbDone && stepCount > 10 },
  ];

  return (
    <div>
      <div className="section-label">Live System Execution</div>

      {/* Live stats bar */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[
          { icon: <Clock size={11} />,    label: "ELAPSED", val: `${elapsed}s`,          valColor: "var(--accent)" },
          { icon: <Activity size={11} />, label: "THREADS",  val: "2 (VT + CRAWLER)",    valColor: "var(--safe)"   },
          { icon: <Cpu size={11} />,      label: "LOG",       val: `${logLines.length}/${LOG_SEQ.length}`, valColor: "var(--text-primary)" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>{s.icon}</span>
            {s.label}:
            <span style={{ color: s.valColor, fontWeight: 500 }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="live-exec-grid">

        {/* Pipeline */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.14em", color: "var(--text-tertiary)", marginBottom: "12px", textTransform: "uppercase" }}>
            Analysis Pipeline
          </p>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: i < steps.length - 1 ? "1px solid var(--border-dim)" : "none" }}>
              <div style={{
                width: "30px", height: "30px", flexShrink: 0, borderRadius: "4px",
                border: `1px solid ${step.done ? "var(--safe-border)" : step.active ? "var(--border-bright)" : "var(--border-dim)"}`,
                background: step.done ? "var(--safe-dim)" : step.active ? "var(--accent-dim)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: step.done ? "var(--safe)" : step.active ? "var(--accent)" : "var(--text-tertiary)",
                transition: "all 300ms ease-out",
              }}>
                {step.done ? <CheckCircle2 size={13} /> : step.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: step.done ? "var(--safe)" : step.active ? "var(--text-accent)" : "var(--text-tertiary)", transition: "color 300ms ease-out" }}>
                  {step.label}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {step.active && !step.done
                    ? <span style={{ color: "var(--accent)" }}>{step.sub}</span>
                    : step.sub}
                </div>
              </div>
              {step.active && !step.done && (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0, animation: "pulse-accent 1.4s linear infinite" }} />
              )}
            </div>
          ))}
        </div>

        {/* Live terminal log */}
        <div className="card" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", minHeight: "220px" }}>
          {/* Terminal chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px", paddingBottom: "9px", borderBottom: "1px solid var(--border-dim)" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["#ef4444","#f59e0b","#22c55e"].map(c => (
                <div key={c} style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, opacity: 0.55 }} />
              ))}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-tertiary)", flex: 1, textAlign: "center", letterSpacing: "0.06em" }}>
              bullseye-agent — system log
            </span>
            <Zap size={10} style={{ color: "var(--accent)", opacity: 0.7 }} />
          </div>

          {/* Log lines */}
          <div ref={logRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px" }}>
            {logLines.map((line, i) => (
              <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0", animation: "slide-in-row 200ms ease-out" }}>
                <span style={{ color: "var(--text-tertiary)", marginRight: "5px", fontSize: "9px", flexShrink: 0 }}>
                  {((line.ts - startMs) / 1000).toFixed(1)}s
                </span>
                <span style={{ color: PREFIX_COLORS[line.prefix] ?? "var(--accent)", marginRight: "5px", fontWeight: 500, flexShrink: 0 }}>
                  [{line.prefix}]
                </span>
                <span style={{ color: "var(--text-secondary)" }}>{line.msg}</span>
              </div>
            ))}
            {/* Blinking cursor */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", padding: "2px 0" }}>
              <span>&gt;</span>
              <span style={{ display: "inline-block", width: "7px", height: "12px", background: "var(--accent)", animation: "blink 1s linear infinite" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AWARENESS PANELS ─────────────────────────────────────────────────────────

const cardGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" } as const;

const AwarenessCard = ({ icon, color, title, body, link, linkLabel }: { icon: React.ReactNode; color: string; title: string; body: string; link?: string; linkLabel?: string }) => (
  <div className="card" style={{ padding: "20px", borderLeft: `2px solid ${color}` }}>
    <div style={{ color, marginBottom: "12px" }}>{icon}</div>
    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "10px" }}>
      {title}
    </h3>
    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: link ? "14px" : "0" }}>
      {body}
    </p>
    {link && (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-display)", fontSize: "9px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-accent)", textDecoration: "none" }}>
        {linkLabel} <ChevronRight size={12} />
      </a>
    )}
  </div>
);

const AwarenessIdle = () => (
  <div>
    <div className="section-label">Threat Intelligence Briefing</div>
    <div style={cardGrid}>
      <AwarenessCard icon={<AlertTriangle size={18} />} color="var(--accent)" title="What is Phishing"
        body="Phishing attacks impersonate trusted entities to steal credentials or deploy malware. Attackers craft URLs that visually mimic legitimate services while routing traffic through malicious infrastructure."
        link="https://www.cybersecurityguide.org/resources/phishing/" linkLabel="Read threat briefing" />
      <AwarenessCard icon={<Activity size={18} />} color="var(--accent)" title="How Malware Spreads"
        body="Drive-by downloads, typosquatting domains, and redirect chains are primary vectors. A single URL visit on an unpatched system can silently install keyloggers or ransomware without user interaction."
        link="https://www.cisa.gov/topics/cyber-threats-and-advisories/malware" linkLabel="Read CISA advisory" />
      <AwarenessCard icon={<Shield size={18} />} color="var(--accent)" title="Why URL Scanning Matters"
        body="90 threat intelligence engines power VirusTotal's analysis. Bullseye queries all simultaneously, combined with a live crawler capturing the actual rendered page — not just DNS records."
        link="https://en.wikipedia.org/wiki/Website_security" linkLabel="Learn more" />
    </div>
  </div>
);

const AwarenessSafe = ({ url }: { url: string }) => {
  let domain = url; try { domain = new URL(url).hostname; } catch {}
  return (
    <div>
      <div className="section-label" style={{ "--text-accent": "var(--safe)" } as React.CSSProperties}>Analysis Complete — Target Verified Safe</div>
      <div style={cardGrid}>
        <AwarenessCard icon={<ShieldCheck size={18} />} color="var(--safe)" title="Why this URL is safe"
          body={`No threat engine flagged ${domain} as malicious. Clean VirusTotal verdict indicates no known malware, phishing kits, or C2 infrastructure associated with this domain.`} />
        <AwarenessCard icon={<Lock size={18} />} color="var(--safe)" title="Safe browsing habits"
          body="Even verified-safe URLs can be compromised later. Bookmark trusted domains rather than clicking links. Always verify HTTPS is active before submitting any credentials." />
        <AwarenessCard icon={<Globe size={18} />} color="var(--safe)" title="Sharing this URL"
          body="This scan result can be shared as evidence of safety. Run a fresh scan before sharing if more than 24 hours have passed — threat status can change if a domain is compromised." />
      </div>
    </div>
  );
};

const AwarenessThreat = ({ url }: { url: string }) => {
  let domain = url; try { domain = new URL(url).hostname; } catch {}
  return (
    <div>
      <div className="section-label" style={{ "--text-accent": "var(--threat)" } as React.CSSProperties}>Threat Detected — Recommended Response Actions</div>
      <div style={cardGrid}>
        <AwarenessCard icon={<ShieldAlert size={18} />} color="var(--threat)" title="Do not visit this URL"
          body={`${domain} has been flagged by threat intelligence engines. Do not open this URL in any browser, even incognito. Malicious payloads can execute regardless of browser state.`} />
        <AwarenessCard icon={<AlertTriangle size={18} />} color="var(--threat)" title="If you already visited"
          body="Clear your browser cache and cookies immediately. Check downloads for unexpected files. Run a full antivirus scan. Change passwords for any accounts accessed during or after the visit." />
        <AwarenessCard icon={<XCircle size={18} />} color="var(--threat)" title="Report this threat"
          body="Report confirmed phishing URLs to Google Safe Browsing, CISA, and your organisation's IT security team. Every report improves collective defense globally." />
      </div>
    </div>
  );
};

const AwarenessPartial = () => (
  <div>
    <div className="section-label">Incomplete Data — Confidence Assessment</div>
    <AwarenessCard icon={<AlertTriangle size={18} />} color="var(--warn)" title="Why results may be incomplete"
      body="One of the two analysis sources returned an error. VirusTotal provides multi-engine threat verdicts while the crawler provides visual confirmation and metadata. A missing source reduces confidence — treat partial results as indicative, not conclusive. Re-scan in a few minutes or verify manually." />
  </div>
);

// ─── MAIN HOME COMPONENT ──────────────────────────────────────────────────────

const Home = () => {
  const { status: sysStatus, latencyMs } = useSystemStatus();
  const [url, setUrl] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [vtResult, setVtResult] = useState<VTResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [logLines, setLogLines] = useState<LogEntry[]>([]);
  const [scanStartMs, setScanStartMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [vtElapsedMs, setVtElapsedMs] = useState<number | null>(null);
  const [crawlerElapsedMs, setCrawlerElapsedMs] = useState<number | null>(null);
  const [vtDone, setVtDone] = useState(false);
  const [crawlerDone, setCrawlerDone] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [awarenessVisible, setAwarenessVisible] = useState(true);
  const [lastScanCached, setLastScanCached] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sr = sessionStorage.getItem("scanResults");
    const vr = sessionStorage.getItem("virusTotalResults");
    if (sr) setScanResult(JSON.parse(sr));
    if (vr) {
      const d = JSON.parse(vr); setVtResult(d);
      setPhase((d.malicious_detections ?? 0) > 0 ? "threat" : "safe");
    } else if (sr) setPhase("partial");
  }, []);

  const scheduleLog = (t0: number) => {
    setLogLines([]);
    logTimersRef.current.forEach(clearTimeout);
    logTimersRef.current = [];
    LOG_SEQ.forEach(({ prefix, msg, delay }) => {
      const id = setTimeout(() => {
        setLogLines((prev) => [...prev, { prefix, msg, ts: t0 + delay }]);
      }, delay);
      logTimersRef.current.push(id);
    });
  };

  const clearLogTimers = () => {
    logTimersRef.current.forEach(clearTimeout);
    logTimersRef.current = [];
  };

  const transitionAwareness = useCallback((next: ScanPhase) => {
    setAwarenessVisible(false);
    setTimeout(() => { setPhase(next); setAwarenessVisible(true); }, 220);
  }, []);

  const handleScan = async () => {
    if (!url || !isValidUrl(url)) {
      setError("Enter a valid URL including https:// or http://");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    setApiErrors([]);
    setScanResult(null);
    setVtResult(null);
    setVtDone(false);
    setCrawlerDone(false);
    setElapsedMs(0);
    setVtElapsedMs(null);
    setCrawlerElapsedMs(null);

    const t0 = Date.now();
    setScanStartMs(t0);

    timerRef.current = setInterval(() => setElapsedMs(Date.now() - t0), 50);
    scheduleLog(t0);
    transitionAwareness("scanning");

    try {
     const isRescan = lastScanCached || (scanResult && !scanResult.crawler_results?.screenshot_url);
      const [crawlerRes, vtRes] = await Promise.allSettled([
        axios.post(`${BACKEND}/crawler/scan`, { url, force_refresh: isRescan }),
        axios.post(`${BACKEND}/virustotal/virustotal_scan`, { url, force_refresh: isRescan }),
      ]);

      const nowTs = Date.now();

      if (crawlerRes.status === "fulfilled") {
        const d = crawlerRes.value.data;
        if (d.error || d.details) {
          setApiErrors((p) => [...p, `Crawler: ${d.details || d.error}`]);
          sessionStorage.removeItem("scanResults");
          setLogLines((p) => [...p, { prefix: "CRAWLER", msg: `ERROR: ${d.details || d.error}`, ts: nowTs }]);
        } else {
          setScanResult(d);
          sessionStorage.setItem("scanResults", JSON.stringify(d));
          setCrawlerElapsedMs(nowTs - t0);
          setCrawlerDone(true);
          setLastScanCached(d.cached === true);
          setLogLines((p) => [...p, {
            prefix: "CRAWLER",
            msg: d.cached
              ? "Cache hit — returning stored result (scan within 24h)"
              : "Analysis complete — screenshot and metadata stored",
            ts: nowTs
          }]);
            }
      } else {
        setApiErrors((p) => [...p, "Crawler agent did not respond."]);
        setLogLines((p) => [...p, { prefix: "CRAWLER", msg: "ERROR: Agent timeout — no response received", ts: nowTs }]);
      }

      if (vtRes.status === "fulfilled") {
        const d = vtRes.value.data;
        setVtResult(d);
        sessionStorage.setItem("virusTotalResults", JSON.stringify(d));
        setVtElapsedMs(nowTs - t0);
        setVtDone(true);
        setLogLines((p) => [...p, { prefix: "VT", msg: `Report received — ${d.malicious_detections ?? 0} malicious / ${d.total_scans ?? "?"} engines`, ts: nowTs }]);
        setLogLines((p) => [...p, { prefix: "DB", msg: "Scan record persisted to MongoDB Atlas", ts: nowTs + 50 }]);
        const isThreat = (d.malicious_detections ?? 0) > 0;
        transitionAwareness(crawlerRes.status === "rejected" ? "partial" : isThreat ? "threat" : "safe");
      } else {
        setApiErrors((p) => [...p, "VirusTotal API did not respond."]);
        setLogLines((p) => [...p, { prefix: "VT", msg: "ERROR: API timeout — verify rate limits", ts: nowTs }]);
        transitionAwareness(crawlerRes.status === "fulfilled" ? "partial" : "idle");
      }

      const totalMs = Date.now() - t0;
      setLogLines((p) => [...p, { prefix: "SYS", msg: `Scan complete — total ${(totalMs / 1000).toFixed(2)}s`, ts: Date.now() }]);
    } catch {
      setError("Unexpected error during scan.");
      transitionAwareness("idle");
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      clearLogTimers();
      setElapsedMs(Date.now() - t0);
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && isValidUrl(url)) handleScan();
  };

  const status = vtResult ? ((vtResult.malicious_detections ?? 0) > 0 ? "threat" : "safe") : null;
  const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

  return (
    <>
      {/* Scan line ambiance */}
      <div className="scanline" />

      <style>{`
        @media (max-width: 380px) { .scan-btn-text { display: none; } }
        @media (max-width: 600px) {
          .live-exec-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", paddingTop: "88px" }}>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <section
          className="grid-bg"
          style={{
            minHeight: "calc(100vh - 88px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 16px 60px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: "min(600px,100vw)", height: "400px", background: "radial-gradient(ellipse at center, rgba(249,115,22,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "640px", width: "100%", position: "relative", zIndex: 1 }}>

            {/* Animated logo */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <BullseyeLogo size={120} />
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 6vw, 46px)", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-primary)", textAlign: "center", lineHeight: 1.1, marginBottom: "10px" }}>
              BULLSEYE
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(9px, 2.2vw, 12px)", color: "var(--text-secondary)", textAlign: "center", letterSpacing: "0.04em", marginBottom: "20px", padding: "0 8px" }}>
              URL THREAT ANALYSIS — VIRUSTOTAL + INTELLIGENT CRAWLING
            </p>

            {/* ── Real-time backend status pill ── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "5px 14px",
                  borderRadius: "20px",
                  background: "var(--bg-card)",
                  border: `1px solid ${
                    sysStatus === "online" ? "var(--safe-border)"
                    : sysStatus === "offline" ? "var(--threat-border)"
                    : "var(--border-mid)"
                  }`,
                  transition: "border-color 400ms ease-out",
                }}
              >
                {/* Animated dot */}
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      sysStatus === "online" ? "var(--safe)"
                      : sysStatus === "offline" ? "var(--threat)"
                      : "var(--warn)",
                    boxShadow:
                      sysStatus === "online" ? "0 0 8px var(--safe)"
                      : sysStatus === "offline" ? "0 0 8px var(--threat)"
                      : "none",
                    animation:
                      sysStatus === "online" ? "pulse-safe 2s linear infinite"
                      : sysStatus === "checking" ? "pulse-accent 1.5s linear infinite"
                      : "none",
                  }}
                />
                {/* Icon */}
                <span style={{ color: sysStatus === "online" ? "var(--safe)" : sysStatus === "offline" ? "var(--threat)" : "var(--warn)" }}>
                  {sysStatus === "offline" ? <WifiOff size={11} /> : <Wifi size={11} />}
                </span>
                {/* Text */}
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "9px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color:
                      sysStatus === "online" ? "var(--safe)"
                      : sysStatus === "offline" ? "var(--threat)"
                      : "var(--warn)",
                  }}
                >
                  {sysStatus === "online" ? "System Online"
                    : sysStatus === "offline" ? "System Offline"
                    : "Connecting..."}
                </span>
                {/* Latency */}
                {sysStatus === "online" && latencyMs != null && (
                  <>
                    <div style={{ width: "1px", height: "10px", background: "var(--border-mid)" }} />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        color: latencyMs < 500 ? "var(--safe)" : latencyMs < 2000 ? "var(--warn)" : "var(--threat)",
                      }}
                    >
                      {latencyMs}ms
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── SCAN INPUT — fully responsive ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-mid)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "stretch",
                overflow: "hidden",
              }}
            >
              {/* Search icon prefix */}
              <div style={{ padding: "0 12px", display: "flex", alignItems: "center", background: "var(--bg-surface)", borderRight: "1px solid var(--border-dim)", flexShrink: 0 }}>
                <Search size={14} style={{ color: "var(--text-tertiary)" }} />
              </div>

              {/* Text input */}
              <input
                ref={inputRef}
                type="url"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="https://target-url.com"
                disabled={loading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(11px, 3vw, 14px)",
                  color: "var(--text-primary)",
                  caretColor: "var(--accent)",
                  padding: "13px 10px",
                }}
              />

              {/* Scan button */}
              <button
                onClick={handleScan}
                disabled={loading || !isValidUrl(url)}
                aria-label="Initiate scan"
                style={{
                  flexShrink: 0,
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: "10px",
                  background: (loading || !isValidUrl(url)) ? "var(--accent-dim)" : "var(--accent)",
                  color: (loading || !isValidUrl(url)) ? "var(--text-accent)" : "#050507",
                  border: "none",
                  cursor: (loading || !isValidUrl(url)) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0 clamp(10px, 3vw, 20px)",
                  minWidth: "44px",
                  transition: "background 150ms linear, color 150ms linear",
                  opacity: (loading || !isValidUrl(url)) ? 0.65 : 1,
                }}
              >
                {loading ? (
                  <span style={{ width: "13px", height: "13px", border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "radar-sweep 0.7s linear infinite", flexShrink: 0 }} />
                ) : (
                  <Search size={13} style={{ flexShrink: 0 }} />
                )}
                <span className="scan-btn-text">{loading ? "SCANNING" : "SCAN"}</span>
              </button>
            </div>

            {/* Inline validation */}
            {url && !isValidUrl(url) && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--threat)", marginTop: "8px" }}>
                &gt; invalid url — include https:// or http://
              </p>
            )}
            {error && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--threat)", marginTop: "8px" }}>
                &gt; {error}
              </p>
            )}
            {apiErrors.length > 0 && (
              <div style={{ marginTop: "10px", padding: "10px 14px", background: "var(--threat-dim)", border: "1px solid var(--threat-border)", borderRadius: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {apiErrors.map((e, i) => (
                  <div key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", display: "flex", alignItems: "flex-start", gap: "8px", color: "var(--text-secondary)" }}>
                    <AlertTriangle size={11} style={{ color: "var(--threat)", flexShrink: 0, marginTop: "2px" }} />
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── LOADING ────────────────────────────────────────────── */}
        {loading && (
          <section ref={resultsRef} style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 16px" }}>
            <div className="card" style={{ padding: "clamp(20px,4vw,40px) clamp(16px,4vw,24px)", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
                <Clock size={11} style={{ color: "var(--text-tertiary)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-tertiary)" }}>
                  ELAPSED: <span style={{ color: "var(--accent)" }}>{(elapsedMs / 1000).toFixed(2)}s</span>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0 8px" }}>
                <BullseyeLogo size={140} />
              </div>
              <div style={{ maxWidth: "460px", margin: "12px auto 0", padding: "8px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-mid)", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={11} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {url}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── RESULTS ────────────────────────────────────────────── */}
        {!loading && (vtResult || scanResult) && (
          <section ref={resultsRef} style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px 40px" }}>
            {vtResult && (
              <div className="animate-fade-in-up" style={{ padding: "14px 18px", marginBottom: "16px", border: `1px solid ${status === "threat" ? "var(--threat-border)" : "var(--safe-border)"}`, borderRadius: "6px", background: status === "threat" ? "var(--threat-dim)" : "var(--safe-dim)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
                  {status === "threat"
                    ? <ShieldAlert size={22} style={{ color: "var(--threat)", flexShrink: 0, animation: "pulse-threat 1.2s linear infinite" }} />
                    : <ShieldCheck size={22} style={{ color: "var(--safe)", flexShrink: 0 }} />
                  }
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(10px,2.5vw,12px)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: status === "threat" ? "var(--text-threat)" : "var(--text-safe)", marginBottom: "4px" }}>
                      {status === "threat" ? "WARNING — MALICIOUS ACTIVITY DETECTED" : "TARGET CLEAN — NO THREATS DETECTED"}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {url}
                    </div>
                  </div>
                </div>
                {elapsedMs > 0 && (
                  <div style={{ display: "flex", gap: "16px", paddingTop: "8px", borderTop: "1px solid var(--border-dim)", flexWrap: "wrap" }}>
                    {[
                      { icon: <Clock size={10} />, label: "TOTAL", val: fmtMs(elapsedMs) },
                      vtElapsedMs != null && { icon: <Shield size={10} />, label: "VT", val: fmtMs(vtElapsedMs!) },
                      crawlerElapsedMs != null && { icon: <Eye size={10} />, label: "CRAWLER", val: fmtMs(crawlerElapsedMs!) },
                    ].filter(Boolean).map((item: any, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                        <span style={{ color: "var(--text-accent)" }}>{item.icon}</span>
                        <span>{item.label}:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.val}</span>
                      </div>
                    ))}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>· parallel execution</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "14px" }}>
              {vtResult && (
                <div className="result-panel animate-fade-in-up">
                  <div className="result-panel-header">
                    <span className="panel-title"><Shield size={10} style={{ display: "inline", marginRight: "5px" }} />Intelligence Feed — VirusTotal</span>
                    <span className={status === "threat" ? "badge-threat" : "badge-safe"}>
                      {status === "threat" ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                      {vtResult.status || (status === "threat" ? "Malicious" : "Clean")}
                    </span>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div className="data-row"><span className="label">Total engines</span><span className="value">{vtResult.total_scans ?? "—"}</span></div>
                    <div className="data-row"><span className="label">Malicious detections</span><span className="value" style={{ color: (vtResult.malicious_detections ?? 0) > 0 ? "var(--threat)" : "var(--safe)", fontWeight: 500 }}>{vtResult.malicious_detections ?? 0}</span></div>
                    <div className="data-row"><span className="label">Last scan date</span><span className="value">{vtResult.last_scan_date ? new Date(vtResult.last_scan_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span></div>
                    <div className="data-row"><span className="label">Verdict</span><span className="value" style={{ color: status === "threat" ? "var(--threat)" : "var(--safe)", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{status === "threat" ? "Malicious" : "Clean"}</span></div>
                  </div>
                </div>
              )}

              {scanResult && (
                <div className="result-panel animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                  <div className="result-panel-header">
                    <span className="panel-title"><Globe size={10} style={{ display: "inline", marginRight: "5px" }} />Recon — Crawler Data</span>
                    <span className="badge-safe"><Activity size={10} />Captured</span>
                  </div>
                  <div style={{ padding: "14px 18px" }}>
                    <div className="data-row"><span className="label">Title</span><span className="value" style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scanResult.crawler_results?.title || "—"}</span></div>
                    <div className="data-row"><span className="label">HTTPS</span><span className="value" style={{ color: scanResult.crawler_results?.https !== false ? "var(--safe)" : "var(--threat)" }}>{scanResult.crawler_results?.https !== false ? "Yes" : "No"}</span></div>
<div className="data-row" style={{ alignItems: "flex-start" }}><span className="label">Description</span><span className="value" style={{ maxWidth: "200px", fontSize: "11px", whiteSpace: "normal", lineHeight: 1.5, textAlign: "right" }}>{scanResult.crawler_results?.description || "—"}</span></div>                    {scanResult.crawler_results?.screenshot_url ? (
                      <div style={{ marginTop: "12px" }}>
                        <div className="screenshot-frame">
                          <img src={scanResult.crawler_results.screenshot_url} alt="Site screenshot" style={{ width: "100%", display: "block" }} />
                        </div>
                        <button className="btn-ghost" onClick={() => setFullscreenUrl(scanResult.crawler_results!.screenshot_url!)} style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}>
                          <Expand size={12} /> View Full Screen
                        </button>
                      </div>
                    ) : (() => {
                        const title = scanResult.crawler_results?.title;
                        const desc = scanResult.crawler_results?.description;
                        const hasContent = title && title !== "No Title";
                        const crawlerBlocked = !hasContent && (!desc || desc === "No Description");
                        const isCached = scanResult.cached === true;

                        // Determine message and label
                        const msg = crawlerBlocked
                          ? "The target site blocked or rejected the crawler request. This is common on login-protected pages, Cloudflare-shielded sites, or pages that detect headless browsers."
                          : isCached
                          ? "This result was served from cache. The original scan did not capture a screenshot. Use Force Rescan to run a fresh crawl."
                          : "The page loaded but Chrome's renderer timed out generating the PNG. This happens on JS-heavy or ad-intensive pages on the free-tier server (limited RAM). Metadata was captured successfully.";

                        const label = crawlerBlocked
                          ? "Crawler blocked or unreachable"
                          : isCached
                          ? "Cached result — no screenshot"
                          : "Renderer timed out — free tier limitation";

                        const iconColor = crawlerBlocked ? "var(--threat)" : "var(--warn)";
                        const bgColor = crawlerBlocked ? "var(--threat-dim)" : "var(--warn-dim)";
                        const borderColor = crawlerBlocked ? "var(--threat-border)" : "rgba(245,158,11,0.25)";

                        return (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "10px 12px",
                              background: bgColor,
                              border: `1px solid ${borderColor}`,
                              borderRadius: "4px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {/* Label row */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <AlertTriangle size={11} style={{ flexShrink: 0, color: iconColor }} />
                              <span
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: iconColor,
                                }}
                              >
                                {label}
                              </span>
                            </div>

                            {/* Message */}
                            <p
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                lineHeight: 1.6,
                                margin: 0,
                              }}
                            >
                              {msg}
                            </p>

                            {/* Rescan button — only shown when not blocked */}
                            {!crawlerBlocked && (
                              <button
                                onClick={() => {
                                  setLastScanCached(true); // triggers force_refresh on next scan
                                  handleScan();
                                }}
                                disabled={loading}
                                style={{
                                  alignSelf: "flex-start",
                                  fontFamily: "var(--font-display)",
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  background: "transparent",
                                  border: "1px solid var(--border-bright)",
                                  borderRadius: "3px",
                                  color: "var(--text-accent)",
                                  cursor: loading ? "not-allowed" : "pointer",
                                  padding: "4px 10px",
                                  opacity: loading ? 0.5 : 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  transition: "all 150ms linear",
                                }}
                              >
                                <Search size={10} />
                                Force Rescan
                              </button>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── AWARENESS ──────────────────────────────────────────── */}
        <section style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px 80px", minHeight: "280px" }}>
          <div style={{ opacity: awarenessVisible ? 1 : 0, transform: awarenessVisible ? "translateY(0)" : "translateY(6px)", transition: "opacity 220ms ease-out, transform 220ms ease-out" }}>
            {phase === "idle"     && <AwarenessIdle />}
            {phase === "scanning" && <LiveSystemExecution logLines={logLines} startMs={scanStartMs} vtDone={vtDone} crawlerDone={crawlerDone} dbDone={vtDone && crawlerDone} />}
            {phase === "safe"     && <AwarenessSafe url={scanResult?.url || url} />}
            {phase === "threat"   && <AwarenessThreat url={scanResult?.url || url} />}
            {phase === "partial"  && <AwarenessPartial />}
          </div>
        </section>
      </div>

      {/* ── FULLSCREEN ─────────────────────────────────────────── */}
      {fullscreenUrl && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenUrl(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button onClick={() => setFullscreenUrl(null)} style={{ position: "absolute", top: "-40px", right: 0, background: "transparent", border: "1px solid var(--border-mid)", borderRadius: "4px", color: "var(--text-secondary)", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-display)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em" }}>
              <X size={12} /> CLOSE
            </button>
            <img src={fullscreenUrl} alt="Full view" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "6px", border: "1px solid var(--border-mid)", display: "block" }} />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;