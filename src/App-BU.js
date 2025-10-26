import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Outlet,
} from "react-router-dom";
import {
  Home,
  Activity,
  Users,
  MessageSquare,
  Scale,
  Sun,
  Moon,
} from "lucide-react";

/* -------------------- Themes -------------------- */
const THEME_PALETTES = {
  dark: {
    name: "dark",
    bg: "#0B1720", // page background
    panel: "#11232F", // sidebar/panel background
    text: "#EAEAEA", // primary text
    muted: "#A7B1B6", // secondary text
    border: "#163645", // borders/dividers
    accent: "#FF5432", // harvest orange
    accent2: "#FF5432", // active border accent
    // Active highlight: same opacity as prior blue, recolored to orange
    linkActiveBg: "rgba(255, 84, 50, 0.15)",
  },
  light: {
    name: "light",
    bg: "#F7FAFC",
    panel: "#FFFFFF",
    text: "#12212B",
    muted: "#5E6A71",
    border: "#E3E8EF",
    accent: "#FF5432",
    accent2: "#FF5432",
    // Keep the same translucent feel in light mode too
    linkActiveBg: "rgba(255, 84, 50, 0.15)",
  },
};

/* -------------------- Root App -------------------- */
export default function App() {
  // Initial theme: localStorage -> OS preference -> dark
  const initialTheme = (() => {
    const saved = window.localStorage.getItem("almanac_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  })();

  const [theme, setTheme] = useState(initialTheme);
  const COLORS = useMemo(() => THEME_PALETTES[theme], [theme]);

  useEffect(() => {
    window.localStorage.setItem("almanac_theme", theme);
    // Update globals for clean page-wide styling
    const root = document.documentElement;
    root.style.background = COLORS.bg;
    root.style.color = COLORS.text;
    root.style.setProperty("color-scheme", theme);
  }, [theme, COLORS]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<Layout theme={theme} setTheme={setTheme} COLORS={COLORS} />}
        >
          {/* shared sidebar */}
          <Route index element={<DashboardPage COLORS={COLORS} />} />
          <Route path="reports" element={<ReportsPage COLORS={COLORS} />} />
          <Route path="models" element={<ModelsPage COLORS={COLORS} />} />
          <Route path="settings" element={<SettingsPage COLORS={COLORS} />} />
          {/* 404 fallback (optional) */}
          <Route path="*" element={<NotFound COLORS={COLORS} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/* -------------------- Layout with Sidebar -------------------- */
function Layout({ theme, setTheme, COLORS }) {
  const styles = useStyles(COLORS);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <>
      {/* Global baseline styles */}
      <style>{`
        html, body, #root {
          background: ${COLORS.bg};
          color: ${COLORS.text};
          height: 100%;
          margin: 0;
          font-family: Barlow, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        a { color: ${COLORS.text}; }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "230px 1fr",
          height: "100vh", // full viewport height
          background: COLORS.bg,
          color: COLORS.text,
          overflow: "hidden", // prevent sidebar pushing scroll
        }}
      >
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <img
              src={
                theme === "dark"
                  ? "/Scout-Script-Fog.png"
                  : "/Scout-Script-Moonstone.png"
              }
              alt="Scout Logo"
              style={{ height: 16, width: "auto" }}
            />

            <span style={styles.brandText}>Almanac Pro</span>
          </div>

          <nav style={{ marginTop: 20 }}>
            <SideLink COLORS={COLORS} to="/" icon={Home} label="Welcome" end />
            <SideLink
              COLORS={COLORS}
              to="/market-simulation"
              icon={Activity}
              label="Market Simulation"
            />
            <SideLink
              COLORS={COLORS}
              to="/customer-groups"
              icon={Users}
              label="Customer Groups"
            />
            <SideLink
              COLORS={COLORS}
              to="/product-sentiments"
              icon={MessageSquare}
              label="Product Sentiments"
            />
            <SideLink
              COLORS={COLORS}
              to="/legal-notice"
              icon={Scale}
              label="Legal Notice"
            />
          </nav>

          {/* Theme Toggle pinned to bottom */}
          <div style={styles.sidebarSpacer} />
          <button
            type="button"
            onClick={toggleTheme}
            style={styles.themeToggle}
            aria-label="Toggle light/dark theme"
            title="Toggle light/dark theme"
          >
            <div style={styles.toggleKnob(theme === "dark")}>
              {theme === "dark" ? (
                <Moon size={14} strokeWidth={1.75} />
              ) : (
                <Sun size={14} strokeWidth={1.75} />
              )}
            </div>
            <span style={{ marginLeft: 10, fontWeight: 600 }}>
              {theme === "dark" ? "Dark" : "Light"} mode
            </span>
          </button>
        </aside>

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}

function SideLink({ to, icon: Icon, label, end, COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...styles.link,
        background: isActive ? COLORS.linkActiveBg : "transparent",
        borderColor: isActive ? COLORS.accent2 : "transparent",
      })}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

/* -------------------- Pages -------------------- */
function DashboardPage({ COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <div>
      <h1 style={styles.h1}>Dashboard</h1>
      <p style={{ color: COLORS.muted }}>
        Put KPIs, filters, and visualizations here.
      </p>
    </div>
  );
}

function ReportsPage({ COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <div>
      <h1 style={styles.h1}>Reports</h1>
      <p style={{ color: COLORS.muted }}>
        Static or ad-hoc reports; export buttons, etc.
      </p>
    </div>
  );
}

function ModelsPage({ COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <div>
      <h1 style={styles.h1}>Models</h1>
      <p style={{ color: COLORS.muted }}>
        Excel-type calculations, scenario inputs, outputs.
      </p>
    </div>
  );
}

function SettingsPage({ COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <div>
      <h1 style={styles.h1}>Settings</h1>
      <p style={{ color: COLORS.muted }}>
        Preferences, data connections, access control, etc.
      </p>
    </div>
  );
}

function NotFound({ COLORS }) {
  const styles = useStyles(COLORS);
  return (
    <div>
      <h1 style={styles.h1}>Not Found</h1>
      <p style={{ color: COLORS.muted }}>The page does not exist.</p>
    </div>
  );
}

/* -------------------- Styles (derived from theme) -------------------- */
function useStyles(COLORS) {
  return {
    sidebar: {
      background: COLORS.panel,
      color: COLORS.text,
      borderRight: `1px solid ${COLORS.border}`,
      padding: "16px 16px 24px", // bottom breathing room
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      boxSizing: "border-box", // keep within viewport
    },

    sidebarSpacer: {
      flex: 1, // pushes toggle to the bottom
    },
    brand: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 6px",
    },
    brandText: {
      fontWeight: 800,
      letterSpacing: 0.3,
      color: "#FF5432",
    },

    link: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderLeft: "3px solid transparent",
      padding: "10px 12px",
      borderRadius: 8,
      color: COLORS.text,
      textDecoration: "none",
      margin: "4px 0",
      fontSize: 12,
      fontWeight: 500,
      transition: "background 0.15s ease, border-color 0.15s ease",
    },

    main: {
      background: COLORS.bg,
      color: COLORS.text,
      padding: 24,
      overflowY: "auto",
    },
    h1: { margin: 0, fontSize: 28, color: COLORS.text },

    themeToggle: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      padding: "10px 12px",
      background: "transparent",
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 600,
      transition: "background 0.15s ease",
    },
    toggleKnob: (isDark) => ({
      width: 28,
      height: 28,
      borderRadius: 999,
      border: `1px solid ${COLORS.border}`,
      background: isDark ? COLORS.panel : "#FFFFFF15",
      display: "grid",
      placeItems: "center",
      fontSize: 14,
      lineHeight: 1,
    }),
  };
}
