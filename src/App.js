import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
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
  Tractor,
  Mountain,
  Waves,
  Warehouse,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* -------------------- Lazy-loaded pages -------------------- */
const Welcome = lazy(() => import("./pages/Welcome"));
const MarketSimulation = lazy(() => import("./pages/MarketSimulation"));
const CustomerGroups = lazy(() => import("./pages/CustomerGroups"));
const ProductSentiments = lazy(() => import("./pages/ProductSentiments"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));

/* -------------------- Base Themes -------------------- */
const THEME_PALETTES = {
  dark: {
    name: "midnight",
    bg: "#0f172a",
    panel: "#111827",
    text: "#e5e7eb",
    muted: "#9ca3af",
    border: "#374151",
    accent: "#FF5432",
    accent2: "#FF5432",
    linkActiveBg: "rgba(255, 84, 50, 0.15)",
  },
  light: {
    name: "daylight",
    bg: "#f6f8fb",
    panel: "#ffffff",
    text: "#0b1220",
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#FF5432",
    accent2: "#FF5432",
    linkActiveBg: "rgba(255, 84, 50, 0.15)",
  },
};

/* -------------------- Accent Color Modes -------------------- */
const ACCENT_MODES = {
  harvester: {
    key: "harvester",
    label: "Harvester",
    hex: "#FF5432",
    icon: Tractor,
  },
  terra: {
    key: "terra",
    label: "Terra",
    hex: "#2E4E61",
    icon: Mountain,
  },
  pacific: {
    key: "pacific",
    label: "Pacific Mist",
    hex: "#7AA5C9",
    icon: Waves,
  },
  silo: {
    key: "silo",
    label: "Silo",
    hex: "#788B61",
    icon: Warehouse,
  },
};

/* -------------------- Root App -------------------- */
export default function App() {
  const initialTheme = (() => {
    const saved = window.localStorage.getItem("almanac_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  })();

  const initialAccent = (() => {
    const saved = window.localStorage.getItem("almanac_accent");
    return ACCENT_MODES[saved]?.key || "harvester";
  })();

  const [theme, setTheme] = useState(initialTheme);
  const [colorMode, setColorMode] = useState(initialAccent);

  const COLORS = useMemo(() => {
    const base = THEME_PALETTES[theme];
    const accentHex = ACCENT_MODES[colorMode].hex;
    return {
      ...base,
      accent: accentHex,
      accent2: accentHex,
      linkActiveBg: hexToAlpha(accentHex, 0.15),
    };
  }, [theme, colorMode]);

  useEffect(() => {
    window.localStorage.setItem("almanac_theme", theme);
    const root = document.documentElement;
    root.style.background = COLORS.bg;
    root.style.color = COLORS.text;
    root.style.setProperty("color-scheme", theme);
  }, [theme, COLORS]);

  useEffect(() => {
    window.localStorage.setItem("almanac_accent", colorMode);
  }, [colorMode]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route
            element={
              <Layout
                theme={theme}
                setTheme={setTheme}
                COLORS={COLORS}
                colorMode={colorMode}
                setColorMode={setColorMode}
              />
            }
          >
            <Route
              index
              element={<Welcome COLORS={COLORS} useStyles={useStyles} />}
            />
            <Route
              path="market-simulation"
              element={
                <MarketSimulation COLORS={COLORS} useStyles={useStyles} />
              }
            />
            <Route
              path="customer-groups"
              element={<CustomerGroups COLORS={COLORS} useStyles={useStyles} />}
            />
            <Route
              path="product-sentiments"
              element={
                <ProductSentiments COLORS={COLORS} useStyles={useStyles} />
              }
            />
            <Route
              path="legal-notice"
              element={<LegalNotice COLORS={COLORS} useStyles={useStyles} />}
            />
            <Route path="*" element={<NotFound COLORS={COLORS} />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function getLogoSrc(theme, colorMode) {
  const dark = theme === "dark";
  switch (colorMode) {
    case "pacific":
      return dark
        ? "/almanac-pro-pacific-fog.png"
        : "/almanac-pro-pacific-moonstone.png";
    case "silo":
      return dark
        ? "/almanac-pro-silo-fog.png"
        : "/almanac-pro-silo-moonstone.png";
    case "terra":
      return dark
        ? "/almanac-pro-terra-fog.png"
        : "/almanac-pro-terra-moonstone.png";
    // Keep Harvester behavior exactly as you have it now:
    case "harvester":
    default:
      return dark ? "/almanac-pro-fog.png" : "/almanac-pro-logo-moonstone.png";
  }
}

/* -------------------- Layout -------------------- */
function Layout({ theme, setTheme, COLORS, colorMode, setColorMode }) {
  const styles = useStyles(COLORS, theme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <>
      <style>{`
        html, body, #root {
          background: ${COLORS.bg};
          color: ${COLORS.text};
          height: 100%;
          margin: 0;
          font-family: Barlow, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
      `}</style>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "270px 1fr",
          height: "100vh",
          background: COLORS.bg,
          color: COLORS.text,
        }}
      >
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <img
              src={getLogoSrc(theme, colorMode)}
              alt="Scout Logo"
              style={{ height: 36, width: "auto" }}
            />
          </div>

          <nav style={{ marginTop: -5 }}>
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

          <div style={styles.sidebarSpacer} />

          <button
            type="button"
            onClick={toggleTheme}
            style={styles.themeToggle}
          >
            <div style={styles.toggleKnob(theme === "dark")}>
              {theme === "dark" ? (
                <Moon size={14} strokeWidth={1.75} />
              ) : (
                <Sun size={14} strokeWidth={1.75} />
              )}
            </div>
            <span style={{ marginLeft: 10, fontWeight: 600 }}>
              {theme === "dark" ? "Midnight" : "Daylight"}
            </span>
          </button>

          {/* Color Drawer Toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            style={styles.drawerToggle}
          >
            <span style={{ fontWeight: 700 }}>Themes</span>
            {drawerOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          <div
            style={{
              ...styles.drawer,
              maxHeight: drawerOpen ? 180 : 0,
              opacity: drawerOpen ? 1 : 0,
              transform: `translateY(${drawerOpen ? "0px" : "8px"})`,
            }}
          >
            <div style={styles.swatchGrid}>
              {Object.values(ACCENT_MODES).map((m) => (
                <ColorIcon
                  key={m.key}
                  label={m.label}
                  icon={m.icon}
                  hex={m.hex}
                  active={colorMode === m.key}
                  onSelect={() => setColorMode(m.key)}
                  COLORS={COLORS}
                />
              ))}
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}

/* -------------------- Color Mode Icon Button -------------------- */
function ColorIcon({ label, icon: Icon, hex, active, onSelect, COLORS }) {
  // tile uses its own color as a soft solid; selected stays as you have it
  const tileBg = rgbaStringToSolidHex(hexToAlpha(hex, 0.08), COLORS.panel);
  const activeBg = rgbaStringToSolidHex(
    hexToAlpha(COLORS.accent, 0.12),
    COLORS.panel
  );

  const border = active
    ? `2px solid ${COLORS.accent}`
    : `1px solid ${COLORS.border}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${label} mode`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: active ? activeBg : tileBg, // ← per-tile tint
        color: COLORS.text,
        border,
        borderRadius: 12,
        padding: 10,
        cursor: "pointer",
        transition: "border-color 0.15s ease, transform 0.15s ease",
      }}
    >
      <Icon size={26} color={hex} strokeWidth={1.8} />
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

/* -------------------- Utilities -------------------- */
function SideLink({ to, icon: Icon, label, end, COLORS }) {
  const styles = useStyles(COLORS);
  const solidActiveBg = rgbaStringToSolidHex(COLORS.linkActiveBg, COLORS.panel);

  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...styles.link,
        background: isActive ? solidActiveBg : "transparent",
        borderColor: isActive ? COLORS.accent2 : "transparent",
      })}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
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

function useStyles(COLORS, theme) {
  const isDark = theme === "dark";

  // Solid backgrounds that track the current accent
  const btnBg = rgbaStringToSolidHex(
    hexToAlpha(COLORS.accent, isDark ? 0.1 : 0.08),
    COLORS.panel
  );
  const knobBgLight = rgbaStringToSolidHex(
    hexToAlpha("#ffffff", 0.15),
    COLORS.panel
  );
  const knobBgDark = rgbaStringToSolidHex(
    hexToAlpha("#ffffff", 0.06),
    COLORS.panel
  );

  return {
    sidebar: {
      background: COLORS.panel,
      color: COLORS.text,
      padding: "16px 16px 24px",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      boxSizing: "border-box",
      position: "relative",
      zIndex: 2,
      boxShadow: isDark
        ? "8px 0 24px rgba(0,0,0,0.55), 1px 0 0 rgba(0,0,0,0.25)"
        : "0px 0 20px rgba(0,0,0,0.25), 0px 0 0 rgba(0,0,0,0.1)",
      ...plaidTexture(COLORS, theme),
    },

    sidebarSpacer: { flex: 1 },

    brand: { display: "flex", alignItems: "center", gap: 10, padding: "20px" },

    link: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderLeft: "3px solid transparent",
      padding: "14px 12px",
      borderRadius: 8,
      color: COLORS.text,
      textDecoration: "none",
      margin: "12px 0",
      fontSize: 16,
      fontWeight: 500,
      transition: "background 0.15s, border-color 0.15s",
    },

    main: {
      background: COLORS.bg,
      color: COLORS.text,
      padding: 24,
      overflowY: "auto",
      position: "relative",
      zIndex: 1,
    },

    h1: { margin: 0, fontSize: 36, color: COLORS.text },

    // Daylight/Midnight toggle button (accent-tinted solid)
    themeToggle: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      padding: "10px 12px",
      background: btnBg,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 8,
    },

    toggleKnob: (isDarkKnob) => ({
      width: 28,
      height: 28,
      borderRadius: 999,
      border: `1px solid ${COLORS.border}`,
      background: isDarkKnob ? knobBgDark : knobBgLight,
      display: "grid",
      placeItems: "center",
    }),

    // Themes dropdown button (accent-tinted solid)
    drawerToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "10px 12px",
      background: btnBg,
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 600,
    },

    drawer: {
      overflow: "hidden",
      transition:
        "max-height 0.18s ease, opacity 0.16s ease, transform 0.16s ease",
      marginTop: 8,
      border: "none",
      borderRadius: 12,
      padding: 12,
      background: "transparent",
    },

    swatchGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  };
}

function hexToAlpha(hex, alpha = 0.15) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbaStringToSolidHex(rgba, bgHex) {
  // expects "rgba(r, g, b, a)"
  const match = rgba.match(
    /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/
  );
  if (!match) return rgba; // fallback if parsing fails

  const r = parseFloat(match[1]);
  const g = parseFloat(match[2]);
  const b = parseFloat(match[3]);
  const a = parseFloat(match[4]);

  const bg = bgHex.replace("#", "");
  const full =
    bg.length === 3
      ? bg
          .split("")
          .map((c) => c + c)
          .join("")
      : bg;
  const br = parseInt(full.slice(0, 2), 16);
  const bgG = parseInt(full.slice(2, 4), 16);
  const bb = parseInt(full.slice(4, 6), 16);

  const outR = Math.round(r * a + br * (1 - a));
  const outG = Math.round(g * a + bgG * (1 - a));
  const outB = Math.round(b * a + bb * (1 - a));

  return `#${[outR, outG, outB]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function plaidTexture(COLORS, theme) {
  const isDark = theme === "dark";

  // much softer opacities
  const thin = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.01)";
  const thick = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.02)";

  // whisper of accent for warmth
  const accentVeil = isDark
    ? hexToAlpha(COLORS.accent, 0.03)
    : hexToAlpha(COLORS.accent, 0.04);

  const blend = isDark
    ? "normal, overlay, overlay"
    : "normal, multiply, multiply";

  return {
    backgroundColor: COLORS.panel,
    backgroundImage: `
      linear-gradient(${accentVeil}, ${accentVeil}),
      repeating-linear-gradient(0deg,
        transparent 0, transparent 6px,
        ${thin} 6px, ${thin} 7px,
        transparent 7px, transparent 14px,
        ${thin} 14px, ${thin} 15px,
        transparent 15px, transparent 30px,
        ${thick} 30px, ${thick} 31px
      ),
      repeating-linear-gradient(90deg,
        transparent 0, transparent 6px,
        ${thin} 6px, ${thin} 7px,
        transparent 7px, transparent 14px,
        ${thin} 14px, ${thin} 15px,
        transparent 15px, transparent 30px,
        ${thick} 30px, ${thick} 31px
      )`,
    backgroundBlendMode: blend,
    backgroundSize: "auto, 40px 40px, 40px 40px",
    backgroundPosition: "0 0, 0 0, 0 0",
  };
}
