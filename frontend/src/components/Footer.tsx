import { Target, GitBranch,ExternalLink, GitGraph } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-dim)",
        padding: "32px 24px",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "24px",
          alignItems: "center",
        }}
      >
        {/* Left — brand + links */}
        <div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "1px solid var(--accent)",
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <Target size={12} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--text-primary)",
              }}
            >
              BULLSEYE
            </span>
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            URL safety scanner — powered by VirusTotal API and intelligent crawling.
          </p>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              { to: "/", label: "Home" },
              { to: "/all-scans", label: "Scans" },
              { to: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  transition: "color 150ms linear",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-accent)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right — meta */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <a
              href="https://github.com/KRITHIKus/safelink"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--font-display)",
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                textDecoration: "none",
                transition: "color 150ms linear",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--text-accent)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")
              }
            >
              <GitGraph size={12} />
              Source
              <ExternalLink size={10} />
            </a>
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-tertiary)",
            }}
          >
            © {year} Bullseye. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-tertiary)",
              marginTop: "4px",
            }}
          >
            Designed, built, and operated independently.
          </p>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "24px auto 0",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--safe)",
            boxShadow: "0 0 6px var(--safe)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-tertiary)",
            letterSpacing: "0.08em",
          }}
        >
          SYSTEM OPERATIONAL — ALL SERVICES RUNNING
        </span>
      </div>
    </footer>
  );
};

export default Footer;