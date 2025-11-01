import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  AreaChart,
  Area,
} from "recharts";
import suvPoints from "./data/suv_points.json";
import puPoints from "./data/pu_points.json";
import demosMapping from "./data/demos-mapping.json";
import codeToTextMapRaw from "./data/code-to-text-map.json";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

/* ---- Local series palette (renamed to avoid clashing with THEME.COLORS) ---- */
const SERIES_COLORS = [
  "#1F77B4",
  "#FF7F0E",
  "#2CA02C",
  "#D62728",
  "#9467BD",
  "#8C564B",
  "#E377C2",
  "#7F7F7F",
  "#BCBD22",
  "#17BECF",
  "#F97316",
  "#14B8A6",
  "#A855F7",
  "#22C55E",
  "#3B82F6",
];

const US_TOPO = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const US_STATE_ABBR_TO_NAME = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};
const US_STATE_NAME_SET = new Set(Object.values(US_STATE_ABBR_TO_NAME));

const LAYOUT = {
  topRowHeight: 620,
  bottomMinHeight: 760,
  subPanelMinHeight: 360,
};

function toStateName(labelRaw) {
  if (!labelRaw) return null;
  const s = String(labelRaw).trim();

  const up = s.toUpperCase();
  if (US_STATE_ABBR_TO_NAME[up]) return US_STATE_ABBR_TO_NAME[up];

  const lower = s.toLowerCase();
  for (const name of US_STATE_NAME_SET) {
    if (name.toLowerCase() === lower) return name;
  }

  const two = (s.match(/\b[A-Z]{2}\b/g) || []).find(
    (tok) => US_STATE_ABBR_TO_NAME[tok.toUpperCase()]
  );
  if (two) return US_STATE_ABBR_TO_NAME[two.toUpperCase()];

  return null;
}

/* ---------- color helpers ---------- */
const hexToRgbStr = (hex) => {
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
  return `${r}, ${g}, ${b}`;
};

const isDarkHex = (hex) => {
  const h = hex?.replace("#", "");
  if (!h || (h.length !== 6 && h.length !== 3)) return false;
  const full =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness < 0.5;
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function hexToRgb(h) {
  const s = h.replace("#", "");
  const v =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}
function rgbToHex({ r, g, b }) {
  const to = (x) => x.toString(16).padStart(2, "0");
  return `#${to(Math.round(r))}${to(Math.round(g))}${to(Math.round(b))}`;
}
function blendHex(aHex, bHex, t) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  return rgbToHex({
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  });
}

// --- deterministic "random" color per model (stable across renders) ---
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0; // keep 32-bit
  }
  return Math.abs(h);
}

function colorForKey(key, allKeys) {
  const keyStr = String(key);
  const idx = allKeys.findIndex((k) => String(k) === keyStr);
  return SERIES_COLORS[(idx >= 0 ? idx : 0) % SERIES_COLORS.length];
}

/* ---------- chart helpers ---------- */
function CentroidDot({ cx, cy, payload, onClick, THEME }) {
  const accent = THEME.accent;
  const ringFill = `${THEME.accent}22`;
  const ringStroke = `${THEME.accent}99`;

  return (
    <g transform={`translate(${cx}, ${cy})`} style={{ cursor: "pointer" }}>
      {/* Big invisible hit area to make clicking easy */}
      <circle r={30} fill="transparent" onClick={() => onClick?.(payload)} />

      {/* Outer ring with subtle glow */}
      <circle
        r={22}
        fill={ringFill}
        stroke={ringStroke}
        strokeWidth={3}
        filter="url(#centroidGlow)"
        onClick={() => onClick?.(payload)}
      />

      {/* Inner core dot */}
      <circle r={6} fill={accent} onClick={() => onClick?.(payload)} />

      {/* Outlined label (C1, C2, …) */}
      <text
        y={-16}
        textAnchor="middle"
        fontSize={16}
        fontWeight={800}
        stroke={THEME.bg}
        strokeWidth={3}
        paintOrder="stroke fill"
        style={{ pointerEvents: "none" }}
      >
        {`C${payload.cluster}`}
      </text>
      <text
        y={-16}
        textAnchor="middle"
        fontSize={16}
        fontWeight={800}
        fill={THEME.text}
        style={{ pointerEvents: "none" }}
      >
        {`C${payload.cluster}`}
      </text>
    </g>
  );
}

function BigDot(props) {
  const { cx, cy, fill } = props;
  return <circle cx={cx} cy={cy} r={10} fill={fill} />;
}

function TinyDot({ cx, cy, fill }) {
  return <circle cx={cx} cy={cy} r={5} fill={fill} />;
}

function paddedDomain(vals) {
  if (!vals.length) return [0, 1];
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    const eps = Math.abs(min || 1) * 0.05;
    min -= eps;
    max += eps;
  }
  const pad = (max - min) * 0.05;
  return [min - pad, max + pad];
}
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
function tweenDomain(from, to, t) {
  const [f0, f1] = from;
  const [t0, t1] = to;
  const e = easeInOutQuad(t);
  return [f0 + (t0 - f0) * e, f1 + (t1 - f1) * e];
}

/* Keys we’ll scan for state-like values */
const STATE_KEYS = [
  "ADMARK_STATE",
  "admark_state",
  "STATE",
  "State",
  "state",
  "DM_STATE",
  "DM_STATE_CODE",
  "STATE_ABBR",
  "state_abbr",
  "ST",
  "st",
];

// --- Dummy persona content you can customize per cluster ---
const PERSONA_BY_CLUSTER = {
  0: {
    title: "C0 • Practical Commuters",
    summary:
      "Budget-conscious, prioritize reliability and total cost of ownership. Commute-focused, low appetite for premium options.",
    bullets: [
      "Top motivations: Value, reliability, low monthly payment",
      "Demographics: Skews 35–54, suburbs, mixed households",
      "Prefers: Advanced safety over performance packages",
      "Channel: Responds to straightforward price/value messaging",
    ],
  },
  1: {
    title: "C1 • Tech-Forward Early Adopters",
    summary:
      "Eager to try new tech, high interest in ADAS and connected features. Comfortable paying extra for innovation.",
    bullets: [
      "Top motivations: Technology, innovation, prestige",
      "Demographics: Skews 25–44, metro, higher income",
      "Prefers: Feature bundles, subscription services",
      "Channel: Digital-first, demo/experiential events",
    ],
  },
  2: {
    title: "C2 • Adventure-Lifestyle",
    summary:
      "Outdoor-oriented profiles interested in utility, towing, and rugged looks—even if used on-road most of the time.",
    bullets: [
      "Top motivations: Utility, design, brand ethos",
      "Demographics: Skews 30–50, active lifestyle",
      "Prefers: All-terrain packages, roof racks, tow options",
      "Channel: Visual storytelling with lifestyle imagery",
    ],
  },
  // Fallback for any other cluster id:
  default: {
    title: "Cluster Persona",
    summary:
      "Audience profile for this cluster. Customize with your internal notes, key stats, and recommended messaging.",
    bullets: [
      "Motivations: …",
      "Demographics: …",
      "Preferred features: …",
      "Go-to channels: …",
    ],
  },
};

function getPersonaForCluster(id) {
  return PERSONA_BY_CLUSTER[id] ?? PERSONA_BY_CLUSTER.default;
}

/** ===== Field Groups for the right-side dropdown ===== */
const FIELD_GROUPS = {
  Demographics: [
    "BLD_AGE_GRP",
    "DEMO_EDUCATION",
    "GENERATION_GRP",
    "DEMO_GENDER1",
    "BLD_HOBBY1_GRP",
    "DEMO_INCOME",
    "BLD_LIFESTAGE",
    "DEMO_LOCATION",
    "DEMO_MARITAL",
    "DEMO_EMPLOY",
    // "ADMARK_STATE", // ← removed per request
    "BLD_CHILDREN",
    "DEMO_EMPTY_NESTER",
  ],
  Financing: [
    "FIN_PU_APR",
    "FIN_PU_DOWN_PAY",
    "FIN_PU_TRADE_IN",
    "BLD_FIN_TOTAL_MONPAY",
    "FIN_PRICE_UNEDITED",
    "FIN_LE_LENGTH",
    "FIN_PU_LENGTH",
    "C1_PL",
    "FIN_CREDIT",
  ],

  "Buying Behavior": ["PR_MOST", "C2S_MODEL_RESPONSE", "SRC_TOP1"],
  Loyalty: [
    "OL_MODEL_GRP",
    "STATE_BUY_BEST",
    "STATE_CONTINUE",
    "STATE_FEEL_GOOD",
    "STATE_REFER",
    "STATE_PRESTIGE",
    "STATE_EURO",
    "STATE_AMER",
    "STATE_ASIAN",
    "STATE_SWITCH_FEAT",
    "STATE_VALUES",
  ],
  "Willingness to Pay": [
    "PV_TAX_INS",
    "PV_SPEND_LUXURY",
    "PV_PRESTIGE",
    "PV_QUALITY",
    "PV_RESALE",
    "PV_INEXP_MAINTAIN",
    "PV_AVOID",
    "PV_SURVIVE",
    "PV_PAY_MORE",
    "PV_BREAKDOWN",
    "PV_VALUE",
    "PV_SPEND",
    "PV_LEASE",
    "PV_PUTOFF",
    "STATE_BALANCE",
    "STATE_WAIT",
    "STATE_ENJOY_PRESTIGE",
    "STATE_FIRST_YR",
    "STATE_NO_LOW_PRICE",
    "STATE_AUDIO",
    "STATE_MON_PAY",
    "STATE_SHOP_MANY",
  ],
};

/** ---------- Financing helpers (formatting + numeric detection) ---------- */
function coerceNumber(v) {
  if (v === null || v === undefined) return NaN;
  const n = Number(String(v).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}
function isLikelyPercentField(field) {
  return /APR|PCT|PERCENT/i.test(field);
}
function isLikelyCurrencyField(field) {
  return /DOWN|TRADE|PAY|MONPAY|PAYMENT|PRICE/i.test(field);
}
function isLikelyLengthField(field) {
  return /LENGTH/i.test(field);
}
function formatFinValue(field, n) {
  if (Number.isNaN(n)) return "—";
  if (isLikelyPercentField(field)) return `${n.toFixed(1)}%`;
  if (isLikelyCurrencyField(field)) {
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  if (isLikelyLengthField(field)) return `${n.toFixed(0)} mo`;
  return n.toLocaleString();
}

/* ---- fixed-bucket histogram for FIN_PRICE_UNEDITED ---- */
function coercePrice(v) {
  if (v === null || v === undefined) return NaN;
  const n = Number(String(v).replace(/[$,]/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

const BUCKET_MIN = 30000; // start of first 5k bucket
const BUCKET_STEP = 5000; // 5k wide
const OVER_MIN = 110000; // 110k+ catch-all

function fmtK(n) {
  return `$${Math.round(n / 1000)}k`;
}
function fmtKDec(n) {
  return `$${(n / 1000).toFixed(1)}k`;
}

function bucketLabel(low, high) {
  if (low === -Infinity) return "Under $30k";
  if (high === Infinity) return "$110k+";
  const displayHigh = high - 100;
  return `${fmtK(low)} to ${fmtKDec(displayHigh)}`;
}

/**
 * Build fixed 5k buckets (Under $30k, $30k to $34.9k, ... $110k+)
 */
function getFixedBucketRanges() {
  const ranges = [];
  ranges.push({
    low: -Infinity,
    high: BUCKET_MIN,
    label: bucketLabel(-Infinity, BUCKET_MIN),
  });
  for (let low = BUCKET_MIN; low < OVER_MIN; low += BUCKET_STEP) {
    const high = low + BUCKET_STEP;
    ranges.push({ low, high, label: bucketLabel(low, high) });
  }
  ranges.push({
    low: OVER_MIN,
    high: Infinity,
    label: bucketLabel(OVER_MIN, Infinity),
  });
  return ranges;
}

function buildBucketsForRows(rows) {
  const ranges = getFixedBucketRanges();
  const buckets = ranges.map((r) => ({ ...r, count: 0, pct: 0 }));

  const vals = [];
  for (const r of rows) {
    const n = coercePrice(r?.FIN_PRICE_UNEDITED);
    if (Number.isFinite(n)) vals.push(n);
  }
  const totalValid = vals.length;
  if (totalValid === 0) return { data: [], totalValid: 0 };

  for (const v of vals) {
    let idx = -1;
    if (v < BUCKET_MIN) {
      idx = 0;
    } else if (v >= OVER_MIN) {
      idx = buckets.length - 1;
    } else {
      const stepIdx = Math.floor((v - BUCKET_MIN) / BUCKET_STEP);
      idx =
        1 +
        Math.max(
          0,
          Math.min(stepIdx, (OVER_MIN - BUCKET_MIN) / BUCKET_STEP - 1)
        );
    }
    if (idx >= 0) buckets[idx].count += 1;
  }

  for (const b of buckets) {
    b.pct = totalValid > 0 ? (b.count / totalValid) * 100 : 0;
  }

  const data = buckets.map((b) => ({
    label: b.label,
    pct: b.pct,
    count: b.count,
  }));
  return { data, totalValid };
}

/** Build series for AreaChart grouped by a key ('cluster' or 'model') */
function buildPriceSeriesByGroup(rows, groupingKey, groupOrder) {
  const byGroup = new Map();
  for (const r of rows) {
    const k = groupingKey === "cluster" ? r.cluster : String(r.model);
    if (!byGroup.has(k)) byGroup.set(k, []);
    byGroup.get(k).push(r);
  }
  const keys = groupOrder ?? Array.from(byGroup.keys());
  const series = [];
  for (const k of keys) {
    const arr = byGroup.get(k) || [];
    const { data } = buildBucketsForRows(arr);
    if (data.length) series.push({ key: k, data });
  }
  return series;
}

/* ---- Attitudes agree calc (policy-aligned) ---- */
const AGREE_TOP3 = new Set(["strongly agree", "agree", "somewhat agree"]);
const AGREE_TOP2 = new Set(["strongly agree", "somewhat agree"]);
function normalizeStr(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}
function getAttRaw(row, varName) {
  const v = row?.[varName];
  if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  const aliases = [
    `${varName}_LABEL`,
    `${varName}_TXT`,
    `${varName}_TEXT`,
    `${varName}_DESC`,
    `${varName}_LAB`,
  ];
  for (const a of aliases) {
    const va = row?.[a];
    if (va !== undefined && va !== null && String(va).trim() !== "") return va;
  }
  return null;
}
function normalizeLabel(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
function resolveMappedLabel(row, varName, demoLookups) {
  const raw = getAttRaw(row, varName);
  if (raw === null || raw === undefined) return null;
  const codeMap = demoLookups.get(varName) || new Map();

  if (codeMap.has(raw)) return codeMap.get(raw);
  const asStr = String(raw);
  if (codeMap.has(asStr)) return codeMap.get(asStr);
  const asNum = Number(asStr);
  if (Number.isFinite(asNum)) {
    if (codeMap.has(asNum)) return codeMap.get(asNum);
    if (codeMap.has(String(asNum))) return codeMap.get(String(asNum));
  }
  return asStr;
}
function agreePolicyFor(varName) {
  if (varName === "OL_MODEL_GRP") return "LOYAL_ONLY";
  if (/^STATE_/i.test(varName)) return "TOP2";
  return "TOP3";
}
function isTopNAgree(label, policy) {
  const s = normalizeLabel(label);
  if (policy === "LOYAL_ONLY") return s === "loyal";
  if (policy === "TOP2") return AGREE_TOP2.has(s);
  return AGREE_TOP3.has(s);
}
function percentAgreeMappedPolicy(
  rows,
  varName,
  demoLookups,
  { includeMissingInDenom = true } = {}
) {
  let agree = 0,
    valid = 0,
    missing = 0;
  const policy = agreePolicyFor(varName);
  for (const r of rows) {
    const lab = resolveMappedLabel(r, varName, demoLookups);
    if (!lab) {
      missing++;
      continue;
    }
    valid++;
    if (isTopNAgree(lab, policy)) agree++;
  }
  const denom = includeMissingInDenom ? valid + missing : valid;
  return denom > 0 ? (agree / denom) * 100 : NaN;
}

function useAnimationToken(deps) {
  return React.useMemo(() => deps.join("::"), deps);
}

const CG_SUV_COLOR = "#FF5432";
const CG_PU_COLOR = "#1F6FFF";

const chipFixedCG = (active, baseColor, panelColor, borderColor, textColor) => {
  const alpha = isDarkHex(panelColor) ? 0.22 : 0.14;
  return {
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${active ? baseColor : borderColor}`,
    background: active
      ? `rgba(${hexToRgbStr(baseColor)}, ${alpha})`
      : "transparent",
    color: textColor,
    cursor: "pointer",
    fontSize: 14,
    transition: "border-color 120ms ease, background-color 120ms ease",
    minWidth: 90,
    textAlign: "center",
  };
};

export default function CustomerGroups({ COLORS: THEME, useStyles }) {
  // NEW: dataset mode — "CORE" (current SUV/Pickup) or "SEGMENTS" (placeholder)
  const [datasetMode, setDatasetMode] = useState("CORE");

  const [group, setGroup] = useState("SUV");
  const dataPoints =
    datasetMode === "CORE" ? (group === "SUV" ? suvPoints : puPoints) : []; // SEGMENTS: no data yet

  // Reset key view states when switching modes
  useEffect(() => {
    setZoomCluster(null);
    setCenterT(0);
    setSelectedStateName(null);
    setDemoModel(null);
  }, [datasetMode]);

  // Normalize rows
  const rows = useMemo(() => {
    const out = [];
    for (const r of dataPoints || []) {
      const modelVal =
        r?.model ??
        r?.BLD_DESC_RV_MODEL ??
        r?.Model ??
        r?.model_name ??
        r?.MODEL ??
        null;
      const x = Number(r?.emb_x);
      const y = Number(r?.emb_y);
      const cl = Number(r?.cluster);
      if (
        !modelVal ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(cl)
      )
        continue;

      out.push({
        ...r,
        model: String(modelVal),
        raw_x: x,
        raw_y: y,
        emb_x: x,
        emb_y: y,
        cluster: cl,
      });
    }
    return out;
  }, [dataPoints]);

  const allModels = useMemo(
    () => Array.from(new Set(rows.map((r) => r.model))).sort(),
    [rows]
  );

  const modelColors = useMemo(() => {
    const map = {};
    for (const m of allModels) {
      const idx = hashStr(m) % SERIES_COLORS.length;
      map[m] = SERIES_COLORS[idx];
    }
    return map;
  }, [allModels]);

  const [selectedModels, setSelectedModels] = useState(allModels);
  const [colorMode, setColorMode] = useState("model"); // default to Model
  const [zoomCluster, setZoomCluster] = useState(null);
  const [centerT, setCenterT] = useState(0);
  const [selectedStateName, setSelectedStateName] = useState(null);
  const [showPersona, setShowPersona] = useState(false);

  // Right-side category
  const [selectedFieldGroup, setSelectedFieldGroup] = useState("Demographics");

  useEffect(() => setSelectedModels(allModels), [allModels]);
  useEffect(() => {
    setZoomCluster(null);
    setCenterT(0);
  }, [group]);

  const toggleModel = (m) =>
    setSelectedModels((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  const selectAll = () => setSelectedModels(allModels);
  const clearAll = () => setSelectedModels([]);

  // --- LOOKUP TABLES (incl. ADMARK_STATE code → label) ---
  const demoLookups = useMemo(() => {
    const byField = new Map();
    for (const row of demosMapping || []) {
      const field = String(row?.NAME ?? "").trim();
      if (!field) continue;
      const start = row?.START;
      const label = String(row?.LABEL ?? "").trim();
      if (!byField.has(field)) byField.set(field, new Map());
      const m = byField.get(field);
      m.set(start, label);
      m.set(String(start), label);
      if (Number.isFinite(Number(start))) m.set(Number(start), label);
    }
    return byField;
  }, []);

  // ---------- Variable display labels (code → friendly text) ----------
  const VAR_LABELS = useMemo(() => {
    const map = new Map();
    for (const row of codeToTextMapRaw || []) {
      let code = "";
      let text = "";
      if (Array.isArray(row)) {
        code = String(row[0] ?? "").trim();
        text = String(row[1] ?? "").trim();
      } else if (row && typeof row === "object") {
        code = String(
          row.code ??
            row.CODE ??
            row.key ??
            row.Key ??
            row.variable ??
            row.VARIABLE ??
            ""
        ).trim();
        text = String(
          row.text ?? row.label ?? row.LABEL ?? row.display ?? row.Display ?? ""
        ).trim();
      }
      if (code) map.set(code, text || code);
    }
    return map;
  }, [codeToTextMapRaw]);

  function varLabel(code) {
    const c = String(code ?? "").trim();
    return VAR_LABELS.get(c) || c;
  }

  // Resolve full state name from row
  const getRowStateName = useMemo(() => {
    const codeMap = demoLookups.get("ADMARK_STATE") || new Map();
    return (row) => {
      for (const k of STATE_KEYS) {
        if (row && row[k] != null && String(row[k]).trim() !== "") {
          let raw = row[k];
          let val = String(raw).trim();

          if (k === "ADMARK_STATE") {
            const mapped =
              codeMap.get(raw) ||
              codeMap.get(String(raw)) ||
              codeMap.get(Number(raw));
            if (mapped) val = String(mapped).trim();
          }

          const name =
            toStateName(val) ||
            US_STATE_ABBR_TO_NAME[String(val).toUpperCase()] ||
            null;
          if (name) return name;

          const two = (val.match(/\b[A-Z]{2}\b/g) || []).find(
            (tok) => US_STATE_ABBR_TO_NAME[tok.toUpperCase()]
          );
          if (two) return US_STATE_ABBR_TO_NAME[two.toUpperCase()];
        }
      }
      return null;
    };
  }, [demoLookups]);

  // Model filter ONLY (scatter not affected by state)
  const baseByModel = useMemo(() => {
    const active = selectedModels?.length ? selectedModels : allModels;
    return rows.filter((r) => active.includes(r.model));
  }, [rows, selectedModels, allModels]);

  // Scatter frame (model + optional cluster zoom)
  const plotFrame = useMemo(
    () =>
      zoomCluster == null
        ? baseByModel
        : baseByModel.filter((r) => r.cluster === zoomCluster),
    [baseByModel, zoomCluster]
  );

  // Demographics scope (model + optional cluster zoom + optional state)
  const scopeRows = useMemo(() => {
    const base =
      zoomCluster == null
        ? baseByModel
        : baseByModel.filter((r) => r.cluster === zoomCluster);
    if (!selectedStateName) return base;
    return base.filter((r) => getRowStateName(r) === selectedStateName);
  }, [baseByModel, zoomCluster, selectedStateName, getRowStateName]);

  const availableClusters = useMemo(
    () =>
      Array.from(new Set(baseByModel.map((r) => r.cluster))).sort(
        (a, b) => a - b
      ),
    [baseByModel]
  );

  useEffect(() => {
    if (zoomCluster != null && !availableClusters.includes(zoomCluster))
      setZoomCluster(null);
  }, [availableClusters, zoomCluster]);

  // Centroids for collapsing
  const groupingKey = colorMode === "cluster" ? "cluster" : "model";
  const centroidsByGroup = useMemo(() => {
    const acc = new Map();
    for (const r of plotFrame) {
      const k = colorMode === "cluster" ? r.cluster : String(r.model);
      if (!acc.has(k)) acc.set(k, { sumX: 0, sumY: 0, n: 0 });
      const s = acc.get(k);
      s.sumX += r.emb_x;
      s.sumY += r.emb_y;
      s.n += 1;
    }
    const out = new Map();
    for (const [k, s] of acc.entries())
      out.set(k, { cx: s.sumX / s.n, cy: s.sumY / s.n });
    return out;
  }, [plotFrame, colorMode]);

  const plotDataCentered = useMemo(() => {
    if (centerT <= 0) return plotFrame;
    const out = new Array(plotFrame.length);
    for (let i = 0; i < plotFrame.length; i++) {
      const r = plotFrame[i];
      const key = colorMode === "cluster" ? r.cluster : String(r.model);
      const c = centroidsByGroup.get(key);
      out[i] = c
        ? {
            ...r,
            emb_x: lerp(r.raw_x, c.cx, centerT),
            emb_y: lerp(r.raw_y, c.cy, centerT),
          }
        : r;
    }
    return out;
  }, [plotFrame, centroidsByGroup, centerT, colorMode]);

  const groupKeys = useMemo(() => {
    const g = new Set(plotDataCentered.map((r) => r[groupingKey]));
    let arr = Array.from(g);
    if (colorMode === "cluster")
      arr = arr.filter((k) => Number.isFinite(k)).sort((a, b) => a - b);
    else arr = arr.map(String).sort();
    return arr;
  }, [plotDataCentered, groupingKey, colorMode]);

  const series = useMemo(() => {
    const buckets = new Map();
    for (const r of plotDataCentered) {
      const k = colorMode === "cluster" ? r.cluster : String(r.model);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(r);
    }
    return groupKeys.map((k) => ({ key: k, data: buckets.get(k) || [] }));
  }, [plotDataCentered, groupKeys, colorMode]);

  const modelsInScope = useMemo(() => {
    const set = new Set();
    for (const r of plotFrame) set.add(r.model);
    return Array.from(set).sort();
  }, [plotFrame]);

  const [demoModel, setDemoModel] = useState(null);
  useEffect(() => {
    if (demoModel && !modelsInScope.includes(demoModel)) setDemoModel(null);
  }, [modelsInScope, demoModel]);

  // Attitudes selections (default to first in each group)
  const LOYALTY_VARS = FIELD_GROUPS.Loyalty;
  const WTP_VARS = FIELD_GROUPS["Willingness to Pay"];
  const [attXVar, setAttXVar] = useState(LOYALTY_VARS[0]);
  const [attYVar, setAttYVar] = useState(WTP_VARS[0]);

  const animToken = useAnimationToken([
    datasetMode,
    group,
    colorMode,
    zoomCluster ?? "all",
    selectedModels.join("|"),
    selectedStateName ?? "no-state",
    demoModel ?? "all-models",
    attXVar,
    attYVar,
  ]);

  // Attitudes points computed from current scopeRows (includes state filter)
  const attitudesPoints = useMemo(() => {
    const srcRows = demoModel
      ? scopeRows.filter((r) => r.model === demoModel)
      : scopeRows;
    const byGroup = new Map();
    for (const r of srcRows) {
      const k = colorMode === "cluster" ? r.cluster : String(r.model);
      if (!byGroup.has(k)) byGroup.set(k, []);
      byGroup.get(k).push(r);
    }

    const order = groupKeys; // keep consistent colors with scatter/price chart
    const pts = [];
    for (const k of order) {
      const rs = byGroup.get(k) || [];
      const x = percentAgreeMappedPolicy(rs, attXVar, demoLookups, {
        includeMissingInDenom: true,
      });
      const y = percentAgreeMappedPolicy(rs, attYVar, demoLookups, {
        includeMissingInDenom: true,
      });
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push({
        key: k,
        name: colorMode === "cluster" ? `C${k}` : String(k),
        x,
        y,
        n: rs.length,
        color: colorForKey(k, order),
      });
    }
    return pts;
  }, [
    scopeRows,
    colorMode,
    groupKeys,
    attXVar,
    attYVar,
    demoLookups,
    demoModel,
  ]);

  const clusterCentroidsForHotspots = useMemo(() => {
    const byCluster = new Map();
    for (const r of baseByModel) {
      const k = r.cluster;
      if (!byCluster.has(k)) byCluster.set(k, { sumX: 0, sumY: 0, n: 0 });
      const s = byCluster.get(k);
      s.sumX += r.emb_x;
      s.sumY += r.emb_y;
      s.n += 1;
    }
    return Array.from(byCluster.entries()).map(([cluster, s]) => ({
      cluster,
      emb_x: s.sumX / s.n,
      emb_y: s.sumY / s.n,
    }));
  }, [baseByModel]);

  // Axis tweening (based on plot frame)
  const targetX = useMemo(
    () => paddedDomain(plotFrame.map((r) => r.emb_x)),
    [plotFrame]
  );
  const targetY = useMemo(
    () => paddedDomain(plotFrame.map((r) => r.emb_y)),
    [plotFrame]
  );
  const [animX, setAnimX] = useState(targetX);
  const [animY, setAnimY] = useState(targetY);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const fromXRef = useRef(targetX);
  const fromYRef = useRef(targetY);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const duration = 400;
    startRef.current = performance.now();
    fromXRef.current = animX || targetX;
    fromYRef.current = animY || targetY;
    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      setAnimX(tweenDomain(fromXRef.current, targetX, t));
      setAnimY(tweenDomain(fromYRef.current, targetY, t));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetX[0], targetX[1], targetY[0], targetY[1]]);

  /* ---------------- Demographics (map context) ---------------- */
  const demoBaseRows = useMemo(() => {
    return zoomCluster == null
      ? baseByModel
      : baseByModel.filter((r) => r.cluster === zoomCluster);
  }, [baseByModel, zoomCluster]);

  const mapBaseRows = useMemo(() => {
    return demoModel
      ? demoBaseRows.filter((r) => r.model === demoModel)
      : demoBaseRows;
  }, [demoBaseRows, demoModel]);

  const stateAgg = useMemo(() => {
    const counts = new Map();
    let total = 0;

    for (const r of mapBaseRows) {
      const name = getRowStateName(r);
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
      total += 1;
    }

    const pcts = new Map();
    let maxPct = 0;

    if (total > 0) {
      for (const [name, c] of counts.entries()) {
        const pct = (c / total) * 100;
        pcts.set(name, pct);
        if (pct > maxPct) maxPct = pct;
      }
    }

    return { counts, pcts, total, maxPct };
  }, [mapBaseRows, getRowStateName]);

  const [hoverState, setHoverState] = useState(null);

  /* ===== Summary builder restricted to selected field group ===== */
  const demoSummary = useMemo(() => {
    const sections = [];

    const fields = FIELD_GROUPS[selectedFieldGroup] || [];
    const srcAll = demoModel
      ? scopeRows.filter((r) => r.model === demoModel)
      : scopeRows;

    // Financing fields that should ALWAYS be categorical
    const categoricalFinFields = new Set(["C1_PL", "FIN_CREDIT"]);

    for (const field of fields) {
      const codeMap = demoLookups.get(field) || new Map();

      // Numeric aggregation for Financing fields not forced categorical
      const isFinancingNumeric =
        selectedFieldGroup === "Financing" && !categoricalFinFields.has(field);

      if (isFinancingNumeric) {
        let sum = 0;
        let wsum = 0;
        let nValid = 0;
        let nMissing = 0;

        for (const r of srcAll) {
          const rawVal = r?.[field];
          const num = coerceNumber(rawVal);
          if (Number.isFinite(num)) {
            sum += num;
            wsum += 1;
            nValid++;
          } else {
            nMissing++;
          }
        }

        if (nValid > 0) {
          const avg = wsum > 0 ? sum / wsum : NaN;
          sections.push({
            field,
            mode: "numeric",
            kpi: {
              label: "Average",
              value: avg,
              display: formatFinValue(field, avg),
              nValid,
              nMissing,
            },
          });
          continue;
        }
        // fall through to categorical if no numeric data
      }

      // ---------- Categorical (% of total INCLUDING Unknown) ----------
      const counts = new Map();
      let validCount = 0;
      let missingCount = 0;

      for (const r of srcAll) {
        const rawVal = r?.[field];
        if (
          rawVal === undefined ||
          rawVal === null ||
          String(rawVal).trim() === ""
        ) {
          missingCount++;
          continue;
        }

        let label = String(rawVal).trim();
        if (codeMap.has(rawVal)) label = codeMap.get(rawVal);
        else if (codeMap.has(String(rawVal)))
          label = codeMap.get(String(rawVal));
        else if (codeMap.has(Number(rawVal)))
          label = codeMap.get(Number(rawVal));
        else {
          const asNum = Number(label);
          if (Number.isFinite(asNum) && codeMap.has(asNum))
            label = codeMap.get(asNum);
          else if (codeMap.has(String(asNum)))
            label = codeMap.get(String(asNum));
        }

        counts.set(label, (counts.get(label) || 0) + 1);
        validCount++;
      }

      if (validCount + missingCount === 0) continue;

      const fieldTotal = validCount + missingCount;
      const items = Array.from(counts.entries())
        .map(([label, count]) => ({
          label,
          count,
          pct: (count / fieldTotal) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      if (missingCount > 0) {
        items.push({
          label: "Unknown",
          count: missingCount,
          pct: (missingCount / fieldTotal) * 100,
        });
      }

      const sumPct = items.reduce((a, b) => a + b.pct, 0);
      if (Math.abs(sumPct - 100) > 0.1 && items.length > 0) {
        const diff = 100 - sumPct;
        items[items.length - 1].pct += diff;
      }

      sections.push({ field, mode: "categorical", items, total: fieldTotal });
    }

    sections.sort((a, b) => {
      if (a.mode !== b.mode) return a.mode === "numeric" ? -1 : 1;
      return (b.items?.[0]?.pct || 0) - (a.items?.[0]?.pct || 0);
    });

    return sections;
  }, [scopeRows, demoModel, demoLookups, selectedFieldGroup]);

  const activeSampleSize = plotFrame.length;

  // Price scope (mirrors the demoModel + state-filter scope used in the right panel)
  const priceScopeRows = useMemo(() => {
    return demoModel
      ? scopeRows.filter((r) => r.model === demoModel)
      : scopeRows;
  }, [demoModel, scopeRows]);

  // Sample size for the Transaction Price chart
  const activePriceSampleSize = priceScopeRows.length;

  /* ---------- UI ---------- */
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        fontFamily: "var(--app-font)",
        background: THEME.bg,
        color: THEME.text,
      }}
    >
      {/* ---- Page Header ---- */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: 0,
            color: THEME.accent,
            fontSize: 38,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Customer Groups
        </h1>

        <p
          style={{
            color: THEME.muted,
            margin: 0,
            fontSize: 20,
            lineHeight: 1.4,
          }}
        >
          Explore how customer segments differ across models and clusters.
          Toggle datasets, select models, or filter by state to see how
          attitudes, transaction prices, and demographics vary within your
          audience.
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          alignItems: "start",
          marginBottom: 12,
        }}
      >
        {/* Category chooser */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Helper text */}
          <div
            style={{
              color: THEME.muted,
              marginTop: 20,
              marginBottom: 2,
              fontSize: 16,
            }}
          >
            Choose category
          </div>

          {/* Mode selector above SUVs / Pickups — styled to match Market Simulation */}
          {(() => {
            const isDark = isDarkHex(THEME.panel);

            // Match the neutral, readable toggle styling from Market Simulation
            const TOGGLE_ACTIVE_BORDER = isDark ? "#FFFFFF" : "#11232F";
            const TOGGLE_ACTIVE_BG = isDark
              ? "rgba(255,255,255,0.22)"
              : "rgba(17,35,47,0.10)";
            const TOGGLE_IDLE_BORDER = THEME.border;
            const TOGGLE_TEXT = THEME.text;

            const options = [
              { id: "CORE", label: "Core Set" },
              { id: "SEGMENTS", label: "Segments" },
            ];

            return (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 4,
                  marginBottom: 12,
                }}
              >
                {options.map((opt) => {
                  const active = datasetMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setDatasetMode(opt.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: active
                          ? `1px solid ${TOGGLE_ACTIVE_BORDER}`
                          : `1px solid ${TOGGLE_IDLE_BORDER}`,
                        background: active ? TOGGLE_ACTIVE_BG : "transparent",
                        fontSize: 16,
                        color: TOGGLE_TEXT,
                        cursor: "pointer",
                        transition:
                          "background-color 120ms ease, border-color 120ms ease",
                      }}
                      title={opt.label}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* SUV / Pickup buttons only for Core Set */}
          {datasetMode === "CORE" ? (
            <>
              {/* SUVs / Pickups label */}
              <div style={{ marginTop: 6 }}>
                <div
                  style={{ color: THEME.muted, marginTop: 8, marginBottom: 12 }}
                >
                  Choose body style
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, max-content)",
                    gap: 8,
                    justifyContent: "start",
                  }}
                >
                  {/* SUVs */}
                  <button
                    onClick={() => setGroup("SUV")}
                    style={chipFixedCG(
                      group === "SUV",
                      CG_SUV_COLOR,
                      THEME.panel,
                      THEME.border,
                      THEME.text
                    )}
                  >
                    SUV
                  </button>

                  {/* Pickups */}
                  <button
                    onClick={() => setGroup("Pickup")}
                    style={chipFixedCG(
                      group === "Pickup",
                      CG_PU_COLOR,
                      THEME.panel,
                      THEME.border,
                      THEME.text
                    )}
                  >
                    Pickup
                  </button>
                </div>
              </div>
            </>
          ) : (
            // SEGMENTS placeholder
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: THEME.muted,
                border: `1px dashed ${THEME.border}`,
                background: THEME.panel,
                padding: "8px 10px",
                borderRadius: 8,
              }}
            >
              Segments dataset coming soon
            </div>
          )}
        </div>

        {/* Model buttons */}
        <div>
          <div style={{ color: THEME.muted, marginTop: 10, marginBottom: 12 }}>
            Choose models
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 8,
              overflowX: "auto",
              whiteSpace: "nowrap",
              paddingBottom: 10,
            }}
          >
            {allModels.map((m) => {
              const active = selectedModels.includes(m);
              const baseColor = modelColors[m] || THEME.accent;

              return (
                <button
                  key={m}
                  onClick={() => toggleModel(m)}
                  style={chipFixedCG(
                    active,
                    baseColor, // border + translucent fill color
                    THEME.panel, // for contrast logic
                    THEME.border, // idle border
                    THEME.text // text color
                  )}
                  title={m}
                >
                  {m}
                </button>
              );
            })}
          </div>

          <div
            style={{ marginTop: 8, marginBottom: 20, display: "flex", gap: 8 }}
          >
            <button
              onClick={selectAll}
              style={{
                background: THEME.panel,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Select all
            </button>
            <button
              onClick={clearAll}
              style={{
                background: THEME.panel,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Color mode + Cluster zoom + Center focus (spaced row) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 40,
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {/* Color mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                border: `1px solid ${THEME.border}`,
                overflow: "hidden",
              }}
            >
              {["cluster", "model"].map((mode) => {
                const active = colorMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    style={{
                      background: active ? THEME.accent : "transparent",
                      color: active ? THEME.onAccent : THEME.text,
                      border: "none",
                      padding: "6px 14px",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "background-color 120ms ease",
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cluster zoom buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setZoomCluster(null)}
              style={{
                background: zoomCluster == null ? THEME.accent : THEME.panel,
                color: zoomCluster == null ? THEME.onAccent : THEME.muted,
                border: `1px solid ${
                  zoomCluster == null ? THEME.accent : THEME.border
                }`,
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              All
            </button>
            {availableClusters.map((k) => {
              const active = zoomCluster === k;
              return (
                <button
                  key={k}
                  onClick={() => setZoomCluster(k)}
                  style={{
                    background: active ? THEME.accent : THEME.panel,
                    color: active ? THEME.onAccent : THEME.muted,
                    border: `1px solid ${active ? THEME.accent : THEME.border}`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >{`C${k}`}</button>
              );
            })}
          </div>

          {/* Center focus slider + % */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ color: THEME.muted }}>Collpase points:</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={centerT}
              onChange={(e) => setCenterT(parseFloat(e.target.value))}
              style={{ width: 200 }}
            />
            <div
              style={{
                width: 10,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {(centerT * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Right Panel */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          flex: 1,
          height: LAYOUT.topRowHeight,
        }}
      >
        {/* Chart (NOT filtered by state) */}
        <div
          style={{
            flex: 1,
            background: THEME.panel,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            height: "100%",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* --- Chart Title: Customer Clusters --- */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 0,
              width: "100%",
              textAlign: "center",
              fontWeight: 700,
              fontSize: 24,
              color: THEME.text,
              pointerEvents: "none",
            }}
          >
            {group === "Pickup" ? "Core Pickup Clusters" : "Core SUV Clusters"}
          </div>

          {/* --- Sample size label --- */}
          <div
            style={{
              position: "absolute",
              top: 45,
              right: 30,
              fontSize: 13,
              fontWeight: 500,
              color: THEME.muted,
              pointerEvents: "none",
            }}
          >
            Sample size:{" "}
            <span style={{ color: THEME.text, fontWeight: 600 }}>
              {activeSampleSize.toLocaleString()}
            </span>
          </div>

          {zoomCluster != null && (
            <button
              onClick={() => setShowPersona(true)}
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                zIndex: 2,
                background: THEME.panel,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
              title="Open persona details"
            >
              Show Persona
            </button>
          )}

          {/* Full-bleed plot area under the title */}
          <div
            style={{
              position: "absolute",
              top: 55,
              left: -35,
              right: 24,
              bottom: -10,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 14, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={THEME.border} strokeDasharray="4 6" />
                <XAxis
                  type="number"
                  dataKey="emb_x"
                  domain={animX}
                  tickFormatter={() => ""}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                />
                <YAxis
                  type="number"
                  dataKey="emb_y"
                  domain={animY}
                  tickFormatter={() => ""}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                />

                {series.map((s) => {
                  const k = s.key;
                  const data = s.data;
                  const fillColor =
                    colorMode === "model"
                      ? modelColors[String(k)] || THEME.accent
                      : colorForKey(k, groupKeys);

                  return (
                    <Scatter
                      key={String(k)}
                      name={colorMode === "cluster" ? `C${k}` : String(k)}
                      data={data}
                      fill={fillColor}
                      isAnimationActive={false}
                      onClick={(pt) => {
                        const clusterVal = pt?.payload?.cluster;
                        if (Number.isFinite(clusterVal))
                          setZoomCluster(clusterVal);
                      }}
                      shape={<TinyDot />}
                    />
                  );
                })}

                {zoomCluster == null && (
                  <Scatter
                    data={clusterCentroidsForHotspots}
                    name=""
                    legendType="none"
                    isAnimationActive={false}
                    shape={(props) => (
                      <CentroidDot
                        {...props}
                        THEME={THEME}
                        onClick={(p) => {
                          if (Number.isFinite(p?.cluster))
                            setZoomCluster(p.cluster);
                        }}
                      />
                    )}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: 360,
            height: "100%",
            background: THEME.panel,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 12,
            color: THEME.text,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          {/* Header row with category dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <select
              value={selectedFieldGroup}
              onChange={(e) => setSelectedFieldGroup(e.target.value)}
              style={{
                background: THEME.panel,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                padding: "6px 10px",
                borderRadius: 8,
                fontWeight: 700,
              }}
              title="Choose category"
            >
              {Object.keys(FIELD_GROUPS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Model focus (single-select) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => setDemoModel(null)}
              style={{
                background: demoModel == null ? THEME.accent : THEME.panel,
                color: demoModel == null ? THEME.onAccent : THEME.muted,
                border: `1px solid ${
                  demoModel == null ? THEME.accent : THEME.border
                }`,
                borderRadius: 8,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              All
            </button>
            {modelsInScope.map((m) => {
              const active = demoModel === m;
              return (
                <button
                  key={`demoModel-${m}`}
                  onClick={() => setDemoModel(m)}
                  style={{
                    background: active ? THEME.accent : THEME.panel,
                    color: active ? THEME.onAccent : THEME.muted,
                    border: `1px solid ${active ? THEME.accent : THEME.border}`,
                    borderRadius: 8,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                  title={m}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Sections list */}
          <div
            style={{
              overflowY: "auto",
              paddingRight: 4,
              gap: 12,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {selectedStateName && scopeRows.length === 0 ? (
              <div
                style={{
                  fontStyle: "italic",
                  opacity: 0.85,
                  padding: "8px 4px",
                }}
              >
                No records for <b>{selectedStateName}</b> in current scope
                (check ADMARK_STATE coding).
              </div>
            ) : demoSummary.length === 0 ? (
              <div
                style={{
                  fontStyle: "italic",
                  opacity: 0.8,
                  padding: "8px 4px",
                }}
              >
                No fields observed in current scope.
              </div>
            ) : (
              demoSummary.map((section) => (
                <div
                  key={section.field}
                  style={{
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 8,
                      color: THEME.text,
                    }}
                  >
                    {varLabel(section.field)}
                  </div>

                  {/* Numeric KPI (Financing averages) */}
                  {section.mode === "numeric" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: THEME.panel,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.8 }}>Average</div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: THEME.accent,
                        }}
                      >
                        {section.kpi.display}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>
                        n={section.kpi.nValid.toLocaleString()}
                        {section.kpi.nMissing
                          ? ` • missing=${section.kpi.nMissing.toLocaleString()}`
                          : ""}
                      </div>
                    </div>
                  ) : (
                    // Categorical (% of total incl Unknown)
                    section.items.map((it) => (
                      <div
                        key={`${section.field}::${it.label}`}
                        style={{ marginBottom: 6 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <div style={{ fontSize: 12, color: THEME.muted }}>
                            {it.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontVariantNumeric: "tabular-nums",
                              color: THEME.text,
                            }}
                          >
                            {it.pct.toFixed(1)}%{" "}
                            <span style={{ opacity: 0.6 }}>
                              ({it.count.toLocaleString()})
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: THEME.panel,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 999,
                            overflow: "hidden",
                            marginTop: 4,
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, it.pct).toFixed(2)}%`,
                              height: "100%",
                              background: THEME.accent,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Stacked (Attitudes over TP) + Map */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 16,
          marginTop: 16,
          alignItems: "stretch",
        }}
      >
        {/* LEFT: Attitudes (top) + Transaction Price (bottom) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: LAYOUT.bottomMinHeight,
          }}
        >
          {/* Attitudes Scatterplot (TOP) */}
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.border}`,
              borderRadius: 12,
              padding: 12,
              flex: 1,
              minHeight: LAYOUT.subPanelMinHeight,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 8,
                  color: THEME.text,
                }}
              >
                Customer Loyalty & Willingness to Pay
              </div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span style={{ fontSize: 12, opacity: 0.85 }}>
                    X (Loyalty):
                  </span>
                  <select
                    value={attXVar}
                    onChange={(e) => setAttXVar(e.target.value)}
                    style={{
                      height: 26,
                      width: 250,
                      fontSize: 12,
                      borderRadius: 6,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.panel,
                      color: THEME.text,
                      padding: "0 6px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {LOYALTY_VARS.map((v) => (
                      <option key={v} value={v}>
                        {varLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span style={{ fontSize: 12, opacity: 0.85 }}>Y (WTP):</span>
                  <select
                    value={attYVar}
                    onChange={(e) => setAttYVar(e.target.value)}
                    style={{
                      height: 26,
                      width: 250,
                      fontSize: 12,
                      borderRadius: 6,
                      border: `1px solid ${THEME.border}`,
                      background: THEME.panel,
                      color: THEME.text,
                      padding: "0 6px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {WTP_VARS.map((v) => (
                      <option key={v} value={v}>
                        {varLabel(v)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 0, right: 20, bottom: -10, left: -15 }}
                >
                  <CartesianGrid stroke={THEME.border} strokeDasharray="4 6" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={varLabel(attXVar)}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    tick={{ fill: THEME.muted, fontSize: 12 }}
                    stroke={THEME.border}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={varLabel(attYVar)}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    tick={{ fill: THEME.muted, fontSize: 12 }}
                    stroke={THEME.border}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ stroke: THEME.border }}
                    contentStyle={{
                      background: THEME.bg,
                      border: `1px solid ${THEME.border}`,
                      color: THEME.text,
                      borderRadius: 8,
                    }}
                    formatter={(value, name) => {
                      if (name === "x")
                        return [
                          `${Number(value).toFixed(1)}%`,
                          varLabel(attXVar),
                        ];
                      if (name === "y")
                        return [
                          `${Number(value).toFixed(1)}%`,
                          varLabel(attYVar),
                        ];
                      return [value, name];
                    }}
                    labelFormatter={() => ""}
                  />

                  {attitudesPoints.map((pt) => (
                    <Scatter
                      key={`att-${pt.key}`}
                      name={pt.name}
                      data={[pt]}
                      fill={
                        colorMode === "model"
                          ? modelColors[String(pt.key)] || THEME.accent
                          : colorForKey(pt.key, groupKeys)
                      }
                      shape={<BigDot />}
                      isAnimationActive={true}
                      animationId={animToken}
                      animationDuration={600}
                      animationEasing="ease-in-out"
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Price (BOTTOM) */}
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.border}`,
              borderRadius: 12,
              padding: 12,
              flex: 1,
              minHeight: LAYOUT.subPanelMinHeight,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: 700,
                fontSize: 22,
                marginTop: 8,
                marginBottom: 0,
                color: THEME.text,
              }}
            >
              Transaction Price
            </div>

            {/* --- Sample size label (Transaction Price) --- */}
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 40,
                fontSize: 13,
                fontWeight: 500,
                color: THEME.muted,
                pointerEvents: "none",
              }}
            >
              Sample size:{" "}
              <span style={{ color: THEME.text, fontWeight: 600 }}>
                {activePriceSampleSize.toLocaleString()}
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const groupingKey =
                    colorMode === "cluster" ? "cluster" : "model";
                  const orderKeys = groupKeys;
                  const series = buildPriceSeriesByGroup(
                    priceScopeRows,
                    groupingKey,
                    orderKeys
                  );

                  if (!series.length) {
                    return (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        No FIN_PRICE_UNEDITED data available in current scope.
                      </div>
                    );
                  }

                  const maxPct = series.reduce(
                    (m, s) =>
                      Math.max(
                        m,
                        ...s.data.map((d) =>
                          Number.isFinite(d.pct) ? d.pct : 0
                        )
                      ),
                    0
                  );
                  const yMax = Math.ceil((maxPct + 2) / 5) * 5;
                  const pctFmt = (v) => `${v.toFixed(0)}%`;
                  const xLabels = series[0].data.map((d) => d.label);

                  return (
                    <AreaChart
                      margin={{ top: 20, right: 20, bottom: -10, left: 0 }}
                    >
                      <CartesianGrid
                        stroke={THEME.border}
                        strokeDasharray="4 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        type="category"
                        allowDuplicatedCategory={false}
                        tick={{ fill: THEME.muted, fontSize: 11 }}
                        stroke={THEME.border}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={52}
                        ticks={xLabels}
                      />
                      <YAxis
                        domain={[0, yMax]}
                        tickFormatter={pctFmt}
                        tick={{ fill: THEME.muted, fontSize: 12 }}
                        stroke={THEME.border}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: THEME.bg,
                          border: `1px solid ${THEME.border}`,
                          color: THEME.text,
                          borderRadius: 8,
                        }}
                        formatter={(value, name, payload) => {
                          const pct = Number(value);
                          const count = payload?.payload?.count ?? 0;
                          return [
                            `${pct.toFixed(1)}% (${count.toLocaleString()})`,
                            name,
                          ];
                        }}
                        labelFormatter={(label) => label}
                      />
                      {/* Legend intentionally omitted */}

                      <defs>
                        {orderKeys.map((k) => {
                          const id = `priceFill_${String(k).replace(
                            /\s+/g,
                            "_"
                          )}`;
                          const col =
                            colorMode === "model"
                              ? modelColors[String(k)] || THEME.accent
                              : colorForKey(k, orderKeys);
                          return (
                            <linearGradient
                              key={id}
                              id={id}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor={col}
                                stopOpacity={0.22}
                              />
                              <stop
                                offset="100%"
                                stopColor={col}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          );
                        })}
                      </defs>

                      {series.map((s) => {
                        const col =
                          colorMode === "model"
                            ? modelColors[String(s.key)] || THEME.accent
                            : colorForKey(s.key, orderKeys);
                        const fillId = `url(#priceFill_${String(s.key).replace(
                          /\s+/g,
                          "_"
                        )})`;
                        const name =
                          colorMode === "cluster" ? `C${s.key}` : String(s.key);
                        return (
                          <React.Fragment key={`series-${String(s.key)}`}>
                            <Area
                              type="monotone"
                              name={name}
                              data={s.data}
                              dataKey="pct"
                              fill={fillId}
                              stroke="none"
                              isAnimationActive={true}
                              animationId={animToken}
                              animationDuration={650}
                              animationEasing="ease-in-out"
                            />
                            <Line
                              type="monotone"
                              name={name}
                              data={s.data}
                              dataKey="pct"
                              stroke={col}
                              strokeWidth={2}
                              dot={false}
                              activeDot={false}
                              isAnimationActive={true}
                              animationId={animToken}
                              animationDuration={650}
                              animationEasing="ease-in-out"
                            />
                          </React.Fragment>
                        );
                      })}
                    </AreaChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: Geographic map */}
        <div
          style={{
            background: THEME.panel,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: 12,
            minHeight: LAYOUT.bottomMinHeight,
            boxSizing: "border-box",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedStateName && (
            <button
              onClick={() => setSelectedStateName(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: THEME.panel,
                color: THEME.text,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: "4px 8px",
                fontSize: 12,
                cursor: "pointer",
              }}
              title="Clear state filter"
            >
              Clear
            </button>
          )}

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontWeight: 700,
              fontSize: 22,
              marginTop: 8,
              marginBottom: 0,
              color: THEME.text,
            }}
          >
            State of Residence
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: 8,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <ComposableMap
              projection="geoAlbersUsa"
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={US_TOPO}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = geo.properties.name;

                    const pct = stateAgg.pcts.get(name) || 0;
                    const t =
                      stateAgg.maxPct > 0
                        ? Math.min(1, pct / stateAgg.maxPct)
                        : 0;

                    const isSelected = selectedStateName === name;
                    const baseFill = blendHex(THEME.panel, THEME.accent, t);
                    const fill = isSelected
                      ? blendHex(baseFill, "#ffffff", 0.25)
                      : baseFill;
                    const stroke = isSelected ? THEME.accent : THEME.border;
                    const strokeWidth = isSelected ? 2 : 0.75;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => setSelectedStateName(name)}
                        onMouseEnter={() =>
                          setHoverState({
                            name,
                            pct,
                            count: stateAgg.counts.get(name) || 0,
                          })
                        }
                        onMouseLeave={() => setHoverState(null)}
                        style={{
                          default: {
                            fill,
                            stroke,
                            strokeWidth,
                            outline: "none",
                            cursor: "pointer",
                          },
                          hover: {
                            fill: blendHex(fill, "#ffffff", 0.15),
                            stroke,
                            strokeWidth: Math.max(1, strokeWidth),
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill,
                            stroke,
                            strokeWidth: Math.max(1, strokeWidth),
                            outline: "none",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 14,
                fontSize: 13,
                opacity: 0.85,
                textAlign: "right",
              }}
            >
              {hoverState ? (
                <>
                  {hoverState.name}:{" "}
                  <span style={{ fontWeight: 700 }}>
                    {hoverState.pct.toFixed(1)}%
                  </span>
                  {stateAgg.counts.get(hoverState.name) || 0
                    ? ` (${(
                        stateAgg.counts.get(hoverState.name) || 0
                      ).toLocaleString()})`
                    : ""}
                </>
              ) : selectedStateName ? (
                `Filtering Demographics to ${selectedStateName} • ${scopeRows.length.toLocaleString()} records`
              ) : stateAgg.total > 0 ? (
                <>
                  Sample size:{" "}
                  <span style={{ fontWeight: 700 }}>
                    {stateAgg.total.toLocaleString()}
                  </span>
                </>
              ) : (
                "No state data in current scope"
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }} />
          </div>
        </div>
      </div>

      {/* Persona Modal */}
      {showPersona && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPersona(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 94vw)",
              maxHeight: "84vh",
              overflowY: "auto",
              background: THEME.bg,
              border: `1px solid ${THEME.border}`,
              borderRadius: 12,
              boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
              color: THEME.text,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: `1px solid ${THEME.border}`,
                position: "sticky",
                top: 0,
                background: THEME.bg,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                zIndex: 1,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {(() => {
                  const persona = getPersonaForCluster(zoomCluster);
                  const groupLabel =
                    datasetMode === "CORE"
                      ? group === "SUV"
                        ? "SUV"
                        : "Pickup"
                      : "Segments";
                  return `${persona.title} — ${groupLabel}`;
                })()}
              </div>
              <button
                onClick={() => setShowPersona(false)}
                style={{
                  background: THEME.panel,
                  color: THEME.text,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                title="Close"
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              {(() => {
                const persona = getPersonaForCluster(zoomCluster);
                return (
                  <>
                    <div
                      style={{
                        padding: "10px 12px",
                        background: THEME.panel,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ fontSize: 14, opacity: 0.9 }}>
                        {persona.summary}
                      </div>
                    </div>

                    {/* Snapshot chips */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.panel,
                        }}
                      >
                        Cluster: C{String(zoomCluster)}
                      </span>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.panel,
                        }}
                      >
                        Points shown: {plotFrame.length.toLocaleString()}
                      </span>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.panel,
                        }}
                      >
                        Color by:{" "}
                        {colorMode === "cluster" ? "Cluster" : "Model"}
                      </span>
                    </div>

                    {/* Key Takeaways */}
                    <div
                      style={{
                        background: THEME.panel,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          borderBottom: `1px solid ${THEME.border}`,
                          fontWeight: 700,
                        }}
                      >
                        Key Takeaways
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          padding: "10px 26px",
                          lineHeight: 1.5,
                        }}
                      >
                        {persona.bullets.map((b, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Placeholders for future content */}
                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "1fr 1fr",
                      }}
                    >
                      <div
                        style={{
                          background: THEME.panel,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          Messaging Angles
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>
                          • Value-first CTA
                          <br />
                          • Tech/features demo
                          <br />• Lifestyle visual story
                        </div>
                      </div>

                      <div
                        style={{
                          background: THEME.panel,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>
                          Feature Priorities
                        </div>
                        <div style={{ fontSize: 14, opacity: 0.9 }}>
                          • ADAS package
                          <br />
                          • Connectivity + app
                          <br />• Towing/utility options
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
