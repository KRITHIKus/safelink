import { useState, useEffect, useRef } from "react";
import {
  Target,
  Shield,
  Globe,
  Database,
  Server,
  Cpu,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Activity,
  Lock,
  Zap,
  Code2,
  Cloud,
  GitBranch,
  Layers,
  Terminal,
  Eye,
  User,
} from "lucide-react";
import { useSystemStatus } from "../context/SystemStatusContext";

// ─── INTERSECTION OBSERVER HOOK ───────────────────────────────────────────────

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// ─── WORKFLOW STEPS ───────────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  {
    id: 0,
    label: "URL Input",
    icon: <Globe size={18} />,
    color: "var(--accent)",
    borderColor: "var(--border-bright)",
    title: "User submits target URL",
    description: "The user enters any URL into Bullseye's scanner. Client-side validation confirms proper URL format (http/https) before the request is dispatched. Input is sanitised and passed to parallel API workers.",
    tech: ["React", "URL Regex", "Client validation"],
    output: "Validated URL payload",
  },
  {
    id: 1,
    label: "VirusTotal API",
    icon: <Shield size={18} />,
    color: "#22d3ee",
    borderColor: "rgba(34,211,238,0.4)",
    title: "Multi-engine threat analysis",
    description: "The URL is submitted to VirusTotal's REST API which orchestrates analysis across 90+ threat intelligence engines simultaneously — including Kaspersky, Symantec, Google, and ESET. Results include malicious detection counts, engine verdicts, and last scan metadata.",
    tech: ["VirusTotal API v3", "FastAPI", "async/await"],
    output: "Detection count, engine verdicts, scan date",
  },
  {
    id: 2,
    label: "Crawler Agent",
    icon: <Camera size={18} />,
    color: "#a78bfa",
    borderColor: "rgba(167,139,250,0.4)",
    title: "Intelligent headless browser",
    description: "A custom Python crawler launches a headless Chromium instance via Playwright or Selenium. It navigates to the target URL, waits for DOM rendering, extracts metadata (title, description, HTTPS status), and captures a full-page screenshot. The screenshot is uploaded to Cloudinary CDN.",
    tech: ["Playwright / Selenium", "Cloudinary CDN", "BeautifulSoup"],
    output: "Screenshot URL, title, description, HTTPS flag",
  },
  {
    id: 3,
    label: "MongoDB",
    icon: <Database size={18} />,
    color: "var(--safe)",
    borderColor: "var(--safe-border)",
    title: "Persistent scan storage",
    description: "Both results are written atomically to MongoDB Atlas. Two collections are maintained: `safesurf` stores scan metadata and VirusTotal verdicts, `screenshots` stores Cloudinary screenshot references indexed by domain name. TTL indexes ensure stale records expire automatically.",
    tech: ["MongoDB Atlas", "PyMongo", "TTL index"],
    output: "Scan ID, persisted record",
  },
  {
    id: 4,
    label: "Results",
    icon: <Eye size={18} />,
    color: "var(--accent)",
    borderColor: "var(--border-bright)",
    title: "Dual-pane verdict display",
    description: "The frontend receives results from both API calls via Promise.allSettled — meaning either source failing does not block the other. Results are displayed in a split intelligence panel: VirusTotal data on the left, crawler recon on the right. Status banners indicate clean or malicious verdicts.",
    tech: ["React state", "Promise.allSettled", "sessionStorage"],
    output: "Verdict banner, dual data panels, screenshot viewer",
  },
];

// ─── TECH STACK DATA ──────────────────────────────────────────────────────────

const TECH_STACK = [
  {
    category: "Frontend",
    icon: <Code2 size={16} />,
    color: "var(--accent)",
    items: [
      { name: "React 18", note: "UI framework" },
      { name: "Vite", note: "Build tooling" },
      { name: "Tailwind CSS 3", note: "Utility styling" },
      { name: "React Router v6", note: "SPA routing" },
      { name: "Lucide React", note: "Icon system" },
      { name: "Axios", note: "HTTP client" },
    ],
  },
  {
    category: "Backend",
    icon: <Server size={16} />,
    color: "#22d3ee",
    items: [
      { name: "Python", note: "Runtime" },
      { name: "FastAPI", note: "REST framework" },
      { name: "Playwright", note: "Headless crawler" },
      { name: "PyMongo", note: "DB driver" },
      { name: "VirusTotal API v3", note: "Threat intelligence" },
      { name: "Cloudinary SDK", note: "Screenshot storage" },
    ],
  },
  {
    category: "Infrastructure",
    icon: <Cloud size={16} />,
    color: "#a78bfa",
    items: [
      { name: "MongoDB Atlas", note: "Cloud database" },
      { name: "Cloudinary CDN", note: "Media storage" },
      { name: "Render.com", note: "Deployment" },
    ],
  },
];

// ─── FEATURES ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <Shield size={14} />, text: "VirusTotal multi-engine URL analysis (90+ engines)" },
  { icon: <Camera size={14} />, text: "Real-time screenshot capture via headless Chromium" },
  { icon: <Activity size={14} />, text: "Parallel API execution — both sources run simultaneously" },
  { icon: <Database size={14} />, text: "Persistent scan history with status filtering" },
  { icon: <Lock size={14} />, text: "HTTPS inspection and SSL validation detection" },
  { icon: <Eye size={14} />, text: "Fullscreen screenshot viewer with lightbox" },
  { icon: <Zap size={14} />, text: "Live scan log with real-time elapsed counter" },
  { icon: <Layers size={14} />, text: "Dark / light theme with 600ms smooth transition" },
  { icon: <Globe size={14} />, text: "Fully responsive — mobile to ultrawide" },
  { icon: <GitBranch size={14} />, text: "Session-persisted results survive page refresh" },
];

// ─── SECTION WRAPPER WITH SCROLL REVEAL ──────────────────────────────────────

const RevealSection = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─── INTERACTIVE WORKFLOW ─────────────────────────────────────────────────────

const InteractiveWorkflow = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance through steps
  useEffect(() => {
    if (!autoPlay) return;
    autoRef.current = setInterval(() => {
      setActiveStep((s) => (s + 1) % WORKFLOW_STEPS.length);
    }, 2800);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoPlay]);

  const selectStep = (i: number) => {
    setAutoPlay(false);
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveStep(i);
  };

  const step = WORKFLOW_STEPS[activeStep];

  return (
    <div>
      {/* Step selector — horizontal nodes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {WORKFLOW_STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {/* Node button */}
            <button
              onClick={() => selectStep(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: `1.5px solid ${activeStep === i ? s.color : "var(--border-mid)"}`,
                  background: activeStep === i ? `${s.color}18` : "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: activeStep === i ? s.color : "var(--text-tertiary)",
                  transition: "all 300ms ease-out",
                  boxShadow: activeStep === i ? `0 0 12px ${s.color}30` : "none",
                }}
              >
                {s.icon}
              </div>
              {/* Label */}
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "8px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: activeStep === i ? s.color : "var(--text-tertiary)",
                  whiteSpace: "nowrap",
                  transition: "color 300ms ease-out",
                }}
              >
                {s.label}
              </span>
              {/* Active underline */}
              {activeStep === i && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "20px",
                    height: "2px",
                    background: s.color,
                    borderRadius: "1px",
                  }}
                />
              )}
            </button>

            {/* Connector line */}
            {i < WORKFLOW_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  minWidth: "20px",
                  background:
                    activeStep > i
                      ? "var(--accent)"
                      : "var(--border-dim)",
                  transition: "background 400ms ease-out",
                  marginTop: "-14px", // align with circle center
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div
        key={activeStep}
        className="card animate-fade-in-up"
        style={{
          padding: "clamp(18px, 4vw, 28px)",
          borderLeft: `2px solid ${step.color}`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              flexShrink: 0,
              borderRadius: "6px",
              border: `1px solid ${step.borderColor}`,
              background: `${step.color}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: step.color,
            }}
          >
            {step.icon}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: step.color,
                marginBottom: "4px",
                letterSpacing: "0.08em",
              }}
            >
              STEP {activeStep + 1} / {WORKFLOW_STEPS.length}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(13px, 2.5vw, 16px)",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "var(--text-primary)",
              }}
            >
              {step.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            marginBottom: "20px",
          }}
        >
          {step.description}
        </p>

        {/* Tech tags + output */}
        <div style={{ marginBottom: "0" }}>
          {/* Technologies */}
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Technologies
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {step.tech.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    padding: "3px 9px",
                    borderRadius: "3px",
                    background: `${step.color}12`,
                    border: `1px solid ${step.borderColor}`,
                    color: step.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Output */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "8px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--text-tertiary)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              Output
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                padding: "8px 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-dim)",
                borderRadius: "3px",
                lineHeight: 1.5,
              }}
            >
              {step.output}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-dim)",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => selectStep((activeStep - 1 + WORKFLOW_STEPS.length) % WORKFLOW_STEPS.length)}
            className="btn-ghost"
            style={{ fontSize: "9px", padding: "6px 12px" }}
          >
            &larr; Prev
          </button>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {WORKFLOW_STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => selectStep(i)}
                style={{
                  width: i === activeStep ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === activeStep ? step.color : "var(--border-mid)",
                  cursor: "pointer",
                  transition: "all 300ms ease-out",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setAutoPlay((a) => !a)}
              className="btn-ghost"
              style={{ fontSize: "9px", padding: "6px 10px" }}
            >
              {autoPlay ? "⏸ Pause" : "▶ Auto"}
            </button>
            <button
              onClick={() => selectStep((activeStep + 1) % WORKFLOW_STEPS.length)}
              className="btn-ghost"
              style={{ fontSize: "9px", padding: "6px 12px" }}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SYSTEM DESIGN DIAGRAM ────────────────────────────────────────────────────

const SystemDesignDiagram = () => {
  const [hover, setHover] = useState<string | null>(null);

  // Layout: client left, backend centre, right column stacked top→bottom
  // Increased viewBox height to 340 and spread nodes so no labels collide
  const nodes = [
    { id: "client",  x: 20,  y: 148, w: 140, h: 46, label: "React Client",    sub: "Vite + Tailwind",        color: "var(--accent)"  },
    { id: "backend", x: 230, y: 148, w: 145, h: 46, label: "FastAPI Backend",  sub: "Python + async",         color: "#22d3ee"         },
    { id: "vt",      x: 500, y: 28,  w: 148, h: 46, label: "VirusTotal API",   sub: "90+ threat engines",     color: "#f59e0b"         },
    { id: "crawler", x: 500, y: 108, w: 148, h: 46, label: "Crawler Agent",    sub: "Headless Chromium",      color: "#a78bfa"         },
    { id: "mongo",   x: 500, y: 188, w: 148, h: 46, label: "MongoDB Atlas",    sub: "safesurf + screenshots", color: "var(--safe)"     },
    { id: "cdn",     x: 500, y: 268, w: 148, h: 46, label: "Cloudinary CDN",   sub: "Screenshot storage",     color: "#f87171"         },
  ];

  const getNode = (id: string) => nodes.find((n) => n.id === id)!;
  const left  = (n: ReturnType<typeof getNode>) => n.x;
  const right = (n: ReturnType<typeof getNode>) => n.x + n.w;
  const top   = (n: ReturnType<typeof getNode>) => n.y;
  const bot   = (n: ReturnType<typeof getNode>) => n.y + n.h;
  const midY  = (n: ReturnType<typeof getNode>) => n.y + n.h / 2;
  const midX  = (n: ReturnType<typeof getNode>) => n.x + n.w / 2;

  // Each edge: path as SVG d string + label position + label text
  const buildEdges = () => {
    const be = getNode("backend");
    const cl = getNode("client");
    const vt = getNode("vt");
    const cr = getNode("crawler");
    const mg = getNode("mongo");
    const cd = getNode("cdn");

    return [
      // client → backend  : straight horizontal, offset +10 above centre
      {
        id: "c-b",
        d: `M ${right(cl)} ${midY(cl) - 8} L ${left(be)} ${midY(be) - 8}`,
        lx: (right(cl) + left(be)) / 2, ly: midY(cl) - 18,
        label: "POST /scan",
        nodes: ["client", "backend"],
      },
      // backend → client  : straight horizontal, offset -10 below centre (return path)
      {
        id: "b-c",
        d: `M ${left(be)} ${midY(be) + 8} L ${right(cl)} ${midY(cl) + 8}`,
        lx: (right(cl) + left(be)) / 2, ly: midY(cl) + 22,
        label: "JSON result",
        nodes: ["backend", "client"],
      },
      // backend → vt      : L-path up then right
      {
        id: "b-vt",
        d: `M ${right(be)} ${midY(be)} L ${right(be) + 40} ${midY(be)} L ${right(be) + 40} ${midY(vt)} L ${left(vt)} ${midY(vt)}`,
        lx: right(be) + 40, ly: midY(vt) - 8,
        label: "VT query",
        nodes: ["backend", "vt"],
      },
      // backend → crawler : straight right
      {
        id: "b-cr",
        d: `M ${right(be)} ${midY(be)} L ${left(cr)} ${midY(cr)}`,
        lx: (right(be) + left(cr)) / 2, ly: midY(cr) - 8,
        label: "crawl job",
        nodes: ["backend", "crawler"],
      },
      // backend → mongo   : L-path down then right
      {
        id: "b-mg",
        d: `M ${right(be)} ${midY(be)} L ${right(be) + 40} ${midY(be)} L ${right(be) + 40} ${midY(mg)} L ${left(mg)} ${midY(mg)}`,
        lx: right(be) + 40, ly: midY(mg) + 14,
        label: "write record",
        nodes: ["backend", "mongo"],
      },
      // crawler → cdn     : straight down
      {
        id: "cr-cd",
        d: `M ${midX(cr)} ${bot(cr)} L ${midX(cr)} ${midY(cd)} L ${left(cd)} ${midY(cd)}`,
        lx: midX(cr) - 48, ly: (bot(cr) + midY(cd)) / 2,
        label: "upload img",
        nodes: ["crawler", "cdn"],
      },
    ];
  };

  const edges = buildEdges();

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox="0 0 668 330"
        style={{ width: "100%", minWidth: "480px", display: "block" }}
        aria-label="System architecture diagram"
      >
        <defs>
          <marker id="arrowSys" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 2L8 5L2 8" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Edges — drawn before nodes so nodes sit on top */}
        {edges.map((edge) => {
          const isH = edge.nodes.some((n) => n === hover);
          return (
            <g key={edge.id}>
              <path
                d={edge.d}
                fill="none"
                stroke={isH ? "var(--accent)" : "var(--border-mid)"}
                strokeWidth={isH ? "1.4" : "0.7"}
                strokeDasharray={isH ? "none" : "4 3"}
                markerEnd="url(#arrowSys)"
                style={{ transition: "stroke 200ms ease-out, stroke-width 200ms ease-out" }}
              />
              <text
                x={edge.lx} y={edge.ly}
                textAnchor="middle"
                fontSize="7.5"
                fill={isH ? "var(--accent)" : "var(--text-tertiary)"}
                fontFamily="var(--font-mono)"
                style={{ transition: "fill 200ms ease-out" }}
              >
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isH = hover === node.id;
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHover(node.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={node.x} y={node.y}
                width={node.w} height={node.h}
                rx="5"
                fill="var(--bg-card)"
                stroke={isH ? node.color : "var(--border-dim)"}
                strokeWidth={isH ? "1.5" : "0.7"}
                style={{ transition: "stroke 200ms ease-out, stroke-width 200ms ease-out" }}
              />
              <rect x={node.x} y={node.y} width="3" height={node.h} rx="1.5" fill={node.color} opacity={isH ? 1 : 0.55} />
              <text x={node.x + 12} y={node.y + 18} fontSize="11" fontWeight="500"
                fill={isH ? node.color : "var(--text-primary)"}
                fontFamily="var(--font-body)"
                style={{ transition: "fill 200ms ease-out" }}>
                {node.label}
              </text>
              <text x={node.x + 12} y={node.y + 33} fontSize="8" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
                {node.sub}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)", textAlign: "center", marginTop: "8px" }}>
        Hover nodes to highlight connections
      </p>
    </div>
  );
};

// ─── MAIN ABOUT PAGE ─────────────────────────────────────────────────────────

const About = () => {
  const { status: sysStatus, latencyMs, scanCount } = useSystemStatus();

  return (
    <div style={{ paddingTop: "88px", minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="grid-bg"
        style={{
          padding: "clamp(48px, 8vw, 96px) 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        {/* Radial glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "300px", background: "radial-gradient(ellipse, rgba(249,115,22,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "640px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "20px",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-mid)",
              fontFamily: "var(--font-display)",
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-accent)",
              marginBottom: "20px",
            }}
          >
            <Target size={10} />
            Project Documentation
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 6vw, 52px)",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            BULLSEYE
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(14px, 2vw, 16px)",
              color: "var(--text-secondary)",
              lineHeight: 1.8,
              marginBottom: "28px",
            }}
          >
Bullseye is a URL threat analysis system designed to evaluate links for potential security risks using external threat intelligence and real-time crawling.

It combines VirusTotal’s multi-engine detection with a custom crawler to inspect live website behavior, capture surface data, and generate clear security verdicts.

The system is built with a focus on reliability, clarity, and real-world usability — designed to reflect how modern security tools operate in production environments.          </p>

          {/* Live stats row */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              {
                icon: <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sysStatus === "online" ? "var(--safe)" : "var(--threat)", boxShadow: sysStatus === "online" ? "0 0 6px var(--safe)" : "none", animation: sysStatus === "online" ? "pulse-safe 2s linear infinite" : "none" }} />,
                label: "Backend",
                value: sysStatus === "online" ? "Online" : sysStatus === "offline" ? "Offline" : "Checking",
                color: sysStatus === "online" ? "var(--safe)" : sysStatus === "offline" ? "var(--threat)" : "var(--warn)",
              },
              latencyMs != null && {
                icon: <Activity size={12} style={{ color: "var(--accent)" }} />,
                label: "Latency",
                value: `${latencyMs}ms`,
                color: "var(--text-primary)",
              },
              scanCount != null && {
                icon: <Database size={12} style={{ color: "var(--accent)" }} />,
                label: "Scans stored",
                value: scanCount.toLocaleString(),
                color: "var(--text-primary)",
              },
              {
                icon: <Shield size={12} style={{ color: "var(--accent)" }} />,
                label: "Threat engines",
                value: "90+",
                color: "var(--text-primary)",
              },
            ].filter(Boolean).map((stat: any, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-dim)",
                  borderRadius: "20px",
                }}
              >
                {stat.icon}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-tertiary)" }}>{stat.label}:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: stat.color, fontWeight: 500 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px 80px" }}>

        {/* ── WHAT IS BULLSEYE ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">What is Bullseye</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {[
                {
                  icon: <Shield size={18} />,
                  color: "var(--accent)",
                  title: "The Problem",
                  body: "Phishing URLs and malware delivery domains are visually indistinguishable from legitimate websites. Most users have no way to verify a URL's safety before visiting — a single click can compromise an entire system.",
                },
                {
                  icon: <Target size={18} />,
                  color: "#22d3ee",
                  title: "The Solution",
                  body: "Bullseye provides a single-input security scan that runs two independent analysis pipelines simultaneously: VirusTotal's 90-engine threat database and a live browser-based crawler — giving both threat intelligence and visual confirmation.",
                },
                {
                  icon: <Zap size={18} />,
                  color: "#a78bfa",
                  title: "Why It Works",
                  body: "The dual-source approach reduces false confidence. A clean VirusTotal score could still reveal suspicious behaviour in the crawler's screenshot. Together, they provide a more complete picture than either source alone.",
                },
              ].map((card, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="card" style={{ padding: "20px", height: "100%", borderLeft: `2px solid ${card.color}` }}>
                    <div style={{ color: card.color, marginBottom: "12px" }}>{card.icon}</div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "10px" }}>{card.title}</h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.75 }}>{card.body}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── INTERACTIVE WORKFLOW ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">How It Works — Interactive Workflow</div>
            <InteractiveWorkflow />
          </RevealSection>
        </section>

        {/* ── SYSTEM DESIGN ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">System Architecture</div>
            <div className="card" style={{ padding: "clamp(16px, 4vw, 28px)" }}>
              <SystemDesignDiagram />
            </div>
          </RevealSection>
        </section>

        {/* ── TECH STACK ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">Tech Stack</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {TECH_STACK.map((group, gi) => (
                <RevealSection key={group.category} delay={gi * 80}>
                  <div className="card" style={{ padding: "20px", height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-dim)" }}>
                      <div style={{ color: group.color }}>{group.icon}</div>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: group.color }}>
                        {group.category}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {group.items.map((item) => (
                        <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>
                            {item.name}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                            {item.note}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">Features</div>
            <div className="card" style={{ padding: "clamp(12px, 3vw, 20px)" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "0",
              }}>
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 8px",
                      borderBottom: "1px solid var(--border-dim)",
                    }}
                  >
                    {/* Icon — fixed size, never shrinks */}
                    <div
                      style={{
                        color: "var(--accent)",
                        flexShrink: 0,
                        width: "24px",
                        height: "24px",
                        borderRadius: "3px",
                        background: "var(--accent-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {f.icon}
                    </div>
                    {/* Text — clamps font on very small screens */}
                    <span style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(11px, 2.5vw, 13px)",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      minWidth: 0,
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ── MONGODB SCHEMA ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">Data Schema</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {[
                {
                  collection: "safesurf",
                  color: "var(--safe)",
                  desc: "Stores scan metadata and threat verdicts",
                  fields: [
                    { name: "url", type: "string", note: "Target URL" },
                    { name: "status", type: "string", note: "Safe / Malicious" },
                    { name: "scanDate", type: "ISODate", note: "Timestamp" },
                    { name: "virustotalData", type: "object", note: "Full VT report" },
                    { name: "crawlerData", type: "object", note: "Title, desc, HTTPS" },
                  ],
                },
                {
                  collection: "screenshots",
                  color: "#a78bfa",
                  desc: "Screenshot CDN references indexed by domain",
                  fields: [
                    { name: "url", type: "string", note: "Full target URL" },
                    { name: "websiteName", type: "string", note: "Domain name" },
                    { name: "screenshotUrl", type: "string", note: "Cloudinary URL" },
                  ],
                },
              ].map((schema) => (
                <RevealSection key={schema.collection}>
                  <div className="card" style={{ padding: "20px", borderLeft: `2px solid ${schema.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <Database size={14} style={{ color: schema.color }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: schema.color, fontWeight: 500 }}>
                        {schema.collection}
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-tertiary)", marginBottom: "14px" }}>
                      {schema.desc}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                      {schema.fields.map((field) => (
                        <div key={field.name} className="data-row">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-primary)" }}>
                            {field.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: schema.color }}>
                              {field.type}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                              {field.note}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── FUTURE ENHANCEMENTS ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">Future Enhancements</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {[
                { icon: <User size={14} />,     text: "User login & personal scan dashboards" },
                { icon: <Terminal size={14} />, text: "PDF / email exportable scan reports" },
                { icon: <Activity size={14} />, text: "Graphical threat trend summaries" },
                { icon: <Globe size={14} />,    text: "Internationalisation (i18n) support" },
                { icon: <Zap size={14} />,      text: "Redis caching for repeat URL lookups" },
                { icon: <Shield size={14} />,   text: "Browser extension integration" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-dim)",
                    borderRadius: "5px",
                  }}
                >
                  <div style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>{item.icon}</div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ── AUTHOR ── */}
        <section style={{ padding: "56px 0 0" }}>
          <RevealSection>
            <div className="section-label">Author</div>
            <div className="card" style={{ padding: "clamp(20px, 4vw, 32px)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    flexShrink: 0,
                    borderRadius: "6px",
                    border: "1px solid var(--accent)",
                    background: "var(--accent-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <User size={24} />
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "6px" }}>
                    KRITHIK
                  </h3>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "12px" }}>
                    Full-Stack Developer
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: "16px" }}>
Built Bullseye as a production-style URL analysis system integrating threat intelligence, backend processing, and a structured frontend.

Focused on building systems that are clear, reliable, and usable in real-world conditions.                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <a
                      href="https://github.com/KRITHIKus/safelink"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                    >
                      <GitBranch size={12} />
                      Source Code
                      <ExternalLink size={10} />
                    </a>
                    <a
                      href="https://krithik01.onrender.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                    >
                      <User size={12} />
                      Portfolio
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </section>

      </div>
    </div>
  );
};

export default About;