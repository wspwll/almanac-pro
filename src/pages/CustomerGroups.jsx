// src/pages/CustomerGroups.jsx
import React, { useMemo, useState, useRef } from "react";

/**
 * Interactive clusters demo (no external libs):
 * - Synthetic customers in K clusters
 * - Scatter: Engagement vs Spend
 * - Radar: avg metrics (Selected Cluster vs Overall)
 * - Bars: cluster sizes
 * Interactions:
 * - Hover points → tooltip
 * - Click point or legend → select cluster
 * - Toggle "focus cluster", adjust "noise" and "point size"
 */

const METRICS = [
  { key: "price_sensitivity", label: "Price Sensitivity" },
  { key: "loyalty", label: "Loyalty" },
  { key: "engagement", label: "Engagement" },
  { key: "spend", label: "Spend" },
  { key: "support", label: "Support Tickets" },
  { key: "nps", label: "NPS" },
];

// Distinct cluster colors (works for dark & light themes)
const CLUSTER_COLORS = ["#FF5432", "#0CA5E1", "#8B5CF6", "#22C55E", "#F59E0B"];

export default function CustomerGroups({ COLORS, useStyles }) {
  const styles = useStyles(COLORS);

  // Choose signature by theme (dark vs light)
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
  const sigSrc = isDarkHex(COLORS.panel)
    ? "/signature-fog.png"
    : "/signature-moonstone.png";

  // Controls / state
  const [k, setK] = useState(4);
  const [noise, setNoise] = useState(0.35); // 0..1
  const [ptSize, setPtSize] = useState(3.5); // px radius
  const [focusOnly, setFocusOnly] = useState(false);
  const [selected, setSelected] = useState(0); // selected cluster id
  const [hover, setHover] = useState(null); // {x, y, customer}
  const svgRef = useRef(null);

  // Synthetic data
  const { customers, centers } = useMemo(
    () => makeCustomers(k, noise),
    [k, noise]
  );

  // Aggregations
  const overall = useMemo(() => summarize(customers), [customers]);
  const clusterAgg = useMemo(
    () =>
      range(k).map((c) => summarize(customers.filter((d) => d.cluster === c))),
    [customers, k]
  );

  const clusterSizes = clusterAgg.map((a) => a.size);

  // Derived for rendering
  const scatterData = useMemo(
    () => customers.filter((d) => (focusOnly ? d.cluster === selected : true)),
    [customers, focusOnly, selected]
  );

  const card = {
    background: COLORS.panel,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
  };

  const twoCol = {
    display: "grid",
    gridTemplateColumns: "minmax(360px, 1.2fr) minmax(340px, 1fr)",
    gap: 16,
    alignItems: "stretch",
  };

  const controlsRow = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
    gap: 12,
    marginTop: 12,
  };

  const label = { color: COLORS.muted, fontSize: 12, marginBottom: 6 };

  return (
    <div>
      <div
        style={{
          ...card,
          background: "transparent",
          border: "none",
          padding: 18, // keep left edge aligned with other pages
          display: "grid",
          gap: 10,
        }}
      >
        <h1 style={{ ...styles.h1, margin: 0, color: "#FF5432" }}>
          Customer Groups
        </h1>
        <p style={{ color: COLORS.muted, margin: 0 }}>
          Explore customer clusters. Hover points for details, click a point or
          legend to focus a cluster.
        </p>
      </div>

      {/* Controls */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={controlsRow}>
          <div>
            <div style={label}>Clusters (K)</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                value={k}
                onChange={(e) => {
                  const next = +e.target.value;
                  setSelected(Math.min(selected, next - 1));
                  setK(next);
                }}
                style={{ width: "100%", accentColor: COLORS.accent }}
              />
              <strong>{k}</strong>
            </div>
          </div>
          <div>
            <div style={label}>Noise (spread)</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={noise}
                onChange={(e) => setNoise(+e.target.value)}
                style={{ width: "100%", accentColor: COLORS.accent }}
              />
              <strong>{noise.toFixed(2)}</strong>
            </div>
          </div>
          <div>
            <div style={label}>Point Size</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="range"
                min={2}
                max={6}
                step={0.5}
                value={ptSize}
                onChange={(e) => setPtSize(+e.target.value)}
                style={{ width: "100%", accentColor: COLORS.accent }}
              />
              <strong>{ptSize.toFixed(1)}</strong>
            </div>
          </div>
          <div>
            <div style={label}>Focus Selected Cluster</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={focusOnly}
                onChange={(e) => setFocusOnly(e.target.checked)}
              />
              <span>Show only selected</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main visuals */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={twoCol}>
          {/* Scatter */}
          <ScatterClusters
            COLORS={COLORS}
            svgRef={svgRef}
            data={scatterData}
            allData={customers}
            centers={centers}
            k={k}
            ptSize={ptSize}
            selected={selected}
            setSelected={setSelected}
            onHover={setHover}
            focusOnly={focusOnly}
          />

          {/* Right column: Radar + Bars */}
          <div
            style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 16 }}
          >
            <RadarCompare
              COLORS={COLORS}
              metrics={METRICS}
              overall={overall}
              selectedAgg={clusterAgg[selected]}
              selectedColor={CLUSTER_COLORS[selected % CLUSTER_COLORS.length]}
            />
            <ClusterBars
              COLORS={COLORS}
              sizes={clusterSizes}
              selected={selected}
              setSelected={setSelected}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {range(k).map((c) => {
            const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length];
            const active = c === selected;
            return (
              <button
                key={c}
                onClick={() => setSelected(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  background: active ? color + "26" : "transparent",
                  color: COLORS.text,
                  cursor: "pointer",
                }}
                title={`Select Cluster ${c + 1}`}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: color,
                    display: "inline-block",
                  }}
                />
                <strong>Cluster {c + 1}</strong>
                <span style={{ color: COLORS.muted }}>
                  ({clusterSizes[c].toLocaleString()} members)
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Signature (bottom-right, nudged left) */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 8,
          paddingRight: 10,
        }}
      >
        <img
          src={sigSrc}
          alt="Scout Almanac Pro signature"
          style={{ width: 50, height: "auto", opacity: 0.9 }}
        />
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 14,
            top: hover.y + 14,
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            padding: "8px 10px",
            borderRadius: 8,
            pointerEvents: "none",
            zIndex: 50,
            minWidth: 180,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Customer #{hover.customer.id} — Cluster {hover.customer.cluster + 1}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>
            Engagement: <strong>{hover.customer.engagement.toFixed(1)}</strong>
            <br />
            Spend: <strong>${hover.customer.spend.toFixed(0)}</strong>
            <br />
            NPS: <strong>{hover.customer.nps.toFixed(0)}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Scatter Plot -------------------- */

function ScatterClusters({
  COLORS,
  svgRef,
  data,
  allData,
  centers,
  k,
  ptSize,
  selected,
  setSelected,
  onHover,
  focusOnly,
}) {
  const w = 560,
    h = 360,
    pad = 36;

  // domains
  const minX = 0,
    maxX = 100; // engagement 0..100
  const minY = 0,
    maxY = Math.max(1000, Math.max(...allData.map((d) => d.spend)));

  const mapX = (x) => pad + ((x - minX) / (maxX - minX)) * (w - pad * 2);
  const mapY = (y) => h - pad - ((y - minY) / (maxY - minY)) * (h - pad * 2);

  const axisColor = COLORS.border;
  const tickColor = COLORS.muted;

  // mouse helpers
  function handleMove(e, customer) {
    onHover({
      x: e.clientX,
      y: e.clientY,
      customer,
    });
  }
  function clearHover() {
    onHover(null);
  }

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>
        Engagement vs Spend
      </div>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        onMouseLeave={clearHover}
        role="img"
      >
        {/* Axes */}
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke={axisColor}
        />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke={axisColor} />

        {/* Ticks & labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const t = i / 4;
          const x = pad + t * (w - pad * 2);
          const y = h - pad;
          const xv = minX + t * (maxX - minX);
          return (
            <g key={`xt-${i}`}>
              <line x1={x} y1={y} x2={x} y2={y + 4} stroke={axisColor} />
              <text
                x={x}
                y={y + 16}
                fontSize="10"
                textAnchor="middle"
                fill={tickColor}
              >
                {xv.toFixed(0)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: 5 }).map((_, i) => {
          const t = i / 4;
          const y = h - pad - t * (h - pad * 2);
          const yv = minY + t * (maxY - minY);
          return (
            <g key={`yt-${i}`}>
              <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke={axisColor} />
              <text
                x={pad - 8}
                y={y + 3}
                fontSize="10"
                textAnchor="end"
                fill={tickColor}
              >
                ${formatK(yv)}
              </text>
            </g>
          );
        })}

        {/* Centers */}
        {centers.slice(0, k).map((c, i) => {
          const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
          const active = i === selected;
          return (
            <g
              key={`c-${i}`}
              onClick={() => setSelected(i)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={mapX(c.engagement)}
                cy={mapY(c.spend)}
                r={8}
                fill={color}
                opacity={active ? 0.95 : 0.6}
                stroke={COLORS.panel}
                strokeWidth="1.5"
              />
              <text
                x={mapX(c.engagement) + 10}
                y={mapY(c.spend) + 4}
                fontSize="11"
                fill={COLORS.text}
              >
                C{i + 1}
              </text>
            </g>
          );
        })}

        {/* Points */}
        {data.map((d) => {
          const color = CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length];
          const dim = focusOnly && d.cluster !== selected;
          return (
            <circle
              key={d.id}
              cx={mapX(d.engagement)}
              cy={mapY(d.spend)}
              r={ptSize}
              fill={color}
              opacity={dim ? 0.25 : 0.65}
              onMouseMove={(e) => handleMove(e, d)}
              onMouseDown={() => setSelected(d.cluster)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          color: COLORS.muted,
          fontSize: 11,
        }}
      >
        <span>Engagement (0–100)</span>
        <span>Spend</span>
      </div>
    </div>
  );
}

/* -------------------- Radar Chart -------------------- */

function RadarCompare({
  COLORS,
  metrics,
  overall,
  selectedAgg,
  selectedColor,
}) {
  const w = 360,
    h = 360,
    cx = w / 2,
    cy = h / 2,
    r = 130;
  const rings = 4; // grid rings

  const keys = metrics.map((m) => m.key);
  const angles = keys.map(
    (_, i) => (Math.PI * 2 * i) / keys.length - Math.PI / 2
  );

  // normalize 0..1 per metric using overall min/max
  const norm = {};
  keys.forEach((k) => {
    const lo = overall.min[k];
    const hi = overall.max[k] === lo ? lo + 1 : overall.max[k];
    norm[k] = (v) => (v - lo) / (hi - lo);
  });

  const selPoints = keys.map((k, i) => {
    const t = norm[k](selectedAgg.avg[k]);
    return polar(cx, cy, r * clamp01(t), angles[i]);
  });
  const allPoints = keys.map((k, i) => {
    const t = norm[k](overall.avg[k]);
    return polar(cx, cy, r * clamp01(t), angles[i]);
  });

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>
        Traits radar — <strong style={{ color: selectedColor }}>Cluster</strong>{" "}
        vs Overall
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img">
        {/* grid rings */}
        {range(rings).map((i) => {
          const rr = (r * (i + 1)) / rings;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={rr}
              fill="none"
              stroke={COLORS.border}
            />
          );
        })}
        {/* spokes + labels */}
        {angles.map((a, i) => {
          const { x, y } = polar(cx, cy, r, a);
          return (
            <g key={`spoke-${i}`}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={COLORS.border} />
              <text
                x={x}
                y={y}
                fontSize="10"
                textAnchor={x < cx ? "end" : x > cx ? "start" : "middle"}
                dominantBaseline={
                  y < cy ? "text-after-edge" : "text-before-edge"
                }
                fill={COLORS.muted}
                style={{ pointerEvents: "none" }}
              >
                {METRICS[i].label}
              </text>
            </g>
          );
        })}
        {/* overall polygon */}
        <path
          d={polygonPath(allPoints)}
          fill={COLORS.text}
          opacity="0.15"
          stroke={COLORS.text}
          strokeOpacity="0.35"
        />
        {/* selected polygon */}
        <path
          d={polygonPath(selPoints)}
          fill={selectedColor}
          opacity="0.25"
          stroke={selectedColor}
          strokeWidth="2"
        />
        {/* center point */}
        <circle cx={cx} cy={cy} r="2" fill={COLORS.text} opacity="0.6" />
      </svg>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
        <LegendSwatch color={selectedColor} label="Cluster avg" />
        <LegendSwatch color={COLORS.text} label="Overall avg" muted />
      </div>
    </div>
  );
}

/* -------------------- Cluster Size Bars -------------------- */

function ClusterBars({ COLORS, sizes, selected, setSelected }) {
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>Cluster sizes</div>
      <div style={{ display: "grid", gap: 10 }}>
        {sizes.map((s, i) => {
          const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
          const pct = (s / total) * 100;
          const active = i === selected;
          return (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <strong>Cluster {i + 1}</strong>
                <span style={{ color: COLORS.muted }}>
                  {s.toLocaleString()} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: COLORS.border,
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: color,
                    opacity: active ? 0.9 : 0.6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label, muted }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: muted ? "#A7B1B6" : "inherit",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: color,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

/* -------------------- Data generation & math -------------------- */

function makeCustomers(k, noise) {
  const N = 800; // total customers
  // Define cluster centers in metric space (0..100)
  const baseCenters = [
    // price_sensitivity, loyalty, engagement, spend, support, nps
    {
      price_sensitivity: 70,
      loyalty: 30,
      engagement: 45,
      spend: 250,
      support: 6,
      nps: 20,
    },
    {
      price_sensitivity: 35,
      loyalty: 60,
      engagement: 65,
      spend: 520,
      support: 3,
      nps: 45,
    },
    {
      price_sensitivity: 20,
      loyalty: 80,
      engagement: 85,
      spend: 900,
      support: 1,
      nps: 70,
    },
    {
      price_sensitivity: 55,
      loyalty: 45,
      engagement: 30,
      spend: 300,
      support: 5,
      nps: 10,
    },
    {
      price_sensitivity: 85,
      loyalty: 20,
      engagement: 70,
      spend: 420,
      support: 8,
      nps: -5,
    },
  ];

  const centers = baseCenters.slice(0, k).map((c, i) => ({
    ...c,
    id: i,
  }));

  // Generate customers near centers with gaussian-ish noise
  const customers = [];
  for (let i = 0; i < N; i++) {
    const cluster = i % k;
    const c = centers[cluster];
    const jitter = (m, scale = 1) =>
      clamp01(m + (randn() * 15 + randn() * 5) * noise * scale);
    const spendJ = Math.max(
      20,
      c.spend + (randn() * 180 + randn() * 60) * noise
    );

    const engagement = clamp01(c.engagement + randn() * 12 * noise);
    const nps = clamp(-100, 100, c.nps + randn() * 18 * noise);

    customers.push({
      id: i + 1,
      cluster,
      // traits 0..100 scale (spend is ~0..1000)
      price_sensitivity: jitter(c.price_sensitivity),
      loyalty: jitter(c.loyalty),
      engagement: clamp(0, 100, engagement),
      spend: spendJ,
      support: clamp(0, 10, c.support + randn() * 2 * noise),
      nps,
    });
  }

  return { customers, centers };
}

function summarize(rows) {
  const size = rows.length;
  const sums = {};
  const mins = {};
  const maxs = {};
  for (const key of [
    "price_sensitivity",
    "loyalty",
    "engagement",
    "spend",
    "support",
    "nps",
  ]) {
    sums[key] = 0;
    mins[key] = Infinity;
    maxs[key] = -Infinity;
  }
  for (const r of rows) {
    for (const key in sums) {
      const v = r[key];
      sums[key] += v;
      if (v < mins[key]) mins[key] = v;
      if (v > maxs[key]) maxs[key] = v;
    }
  }
  const avg = {};
  for (const key in sums) avg[key] = size ? sums[key] / size : 0;

  // overall min/max for normalization (use mins/maxs when size>0)
  const min = mins;
  const max = maxs;

  return { size, avg, min, max };
}

/* -------------------- Small helpers -------------------- */

function formatK(v) {
  if (v >= 1000) return (v / 1000).toFixed(0) + "k";
  return v.toFixed(0);
}

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

function polar(cx, cy, r, angle) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function polygonPath(points) {
  if (!points.length) return "";
  return (
    points.map((p, i) => (i ? `L${p.x},${p.y}` : `M${p.x},${p.y}`)).join(" ") +
    "Z"
  );
}

function clamp01(v) {
  return Math.max(0, Math.min(100, v));
}
function clamp(lo, hi, v) {
  return Math.max(lo, Math.min(hi, v));
}
function randn() {
  // Box–Muller
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
