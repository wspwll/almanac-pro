// src/pages/MarketSimulation.jsx
import React, { useMemo, useState } from "react";

export default function MarketSimulation({ COLORS, useStyles }) {
  const styles = useStyles(COLORS);

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

  // ---- Initial scenario
  const [state, setState] = useState({
    price: 50,
    base_price: 50,
    base_demand: 10000,
    elasticity: -1.2, // typically negative
    vcpu: 20, // variable cost per unit
    fixed_cost: 120000, // fixed cost
  });

  // ---- Derived calculations (pure function)
  const calc = useMemo(() => deriveAll(state), [state]);

  // ---- Chart series (profit & revenue vs price)
  const series = useMemo(() => buildSeries(state), [state]);

  // ---- Generic handler: set variable, then recalc & possibly solve
  function handleEdit(field, rawValue) {
    const value = toNumberSafe(rawValue);

    // Clone base
    let next = { ...state };

    switch (field) {
      case "price": {
        next.price = clamp(value, 0.01, 1e6);
        break;
      }
      case "elasticity": {
        // keep negative elasticity typical; clamp away from 0 to avoid divide-by-zero
        next.elasticity = clamp(value, -5, -0.05);
        break;
      }
      case "base_price": {
        next.base_price = clamp(value, 0.01, 1e6);
        break;
      }
      case "base_demand": {
        next.base_demand = clamp(value, 1, 1e9);
        break;
      }
      case "vcpu": {
        next.vcpu = clamp(value, 0, 1e6);
        break;
      }
      case "fixed_cost": {
        next.fixed_cost = clamp(value, 0, 1e12);
        break;
      }

      // Edit a derived metric → solve back for price, then recompute
      case "demand": {
        const demandTarget = clamp(value, 1, 1e12);
        next.price = invertElasticityForPrice(
          demandTarget,
          next.base_demand,
          next.base_price,
          next.elasticity
        );
        break;
      }
      case "revenue": {
        const revenueTarget = clamp(value, 0, 1e15);
        next.price = solvePriceForRevenue(
          revenueTarget,
          next.base_demand,
          next.base_price,
          next.elasticity
        );
        break;
      }
      case "profit": {
        const profitTarget = value; // profit can be negative
        next.price = solvePriceForProfit(
          profitTarget,
          next.base_demand,
          next.base_price,
          next.elasticity,
          next.vcpu,
          next.fixed_cost
        );
        break;
      }
      case "margin_pct": {
        // value provided as 0..100 (%)
        const marginTarget = clamp(value / 100, -10, 10); // allow wide, then clamp in solver
        next.price = solvePriceForMargin(
          marginTarget,
          next.base_demand,
          next.base_price,
          next.elasticity,
          next.vcpu,
          next.fixed_cost
        );
        break;
      }

      default:
        break;
    }

    setState(next);
  }

  function resetScenario(kind) {
    if (kind === "Baseline") {
      setState({
        price: 50,
        base_price: 50,
        base_demand: 10000,
        elasticity: -1.2,
        vcpu: 20,
        fixed_cost: 120000,
      });
    } else if (kind === "High FC / Low VC") {
      setState({
        price: 50,
        base_price: 50,
        base_demand: 10000,
        elasticity: -1.0,
        vcpu: 10,
        fixed_cost: 400000,
      });
    } else if (kind === "Premium Pricing") {
      setState({
        price: 120,
        base_price: 80,
        base_demand: 7000,
        elasticity: -0.8,
        vcpu: 25,
        fixed_cost: 180000,
      });
    }
  }

  const card = {
    background: COLORS.panel,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
    boxSizing: "border-box",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
    gap: 16,
    alignItems: "start",
  };

  const inputRow = {
    display: "grid",
    gridTemplateColumns: "1fr 110px", // tighter right column to avoid overflow
    gap: 8,
    alignItems: "center",
  };

  const label = { color: COLORS.muted, fontSize: 13 };

  const number = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.text,
    fontFamily: "inherit",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const slider = {
    width: "100%",
    accentColor: COLORS.accent,
    boxSizing: "border-box",
  };

  const kpiGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
    gap: 12,
  };

  const kpiCard = {
    background: "transparent",
    border: `1px dashed ${COLORS.border}`,
    borderRadius: 12,
    padding: 12,
  };

  // --- chart styles
  const chartGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(260px, 1fr))",
    gap: 16,
    marginTop: 16,
  };

  return (
    <div>
      <div
        style={{
          ...card,
          background: "transparent",
          border: "none",
          padding: 18,
          display: "grid",
          gap: 10,
        }}
      >
        <h1 style={{ ...styles.h1, margin: 0, color: "#FF5432" }}>
          Market Simulation
        </h1>
        <p style={{ color: COLORS.muted, margin: 0 }}>
          Adjust any variable—inputs <em>or</em> outputs—and the model resolves
          the rest.
        </p>
      </div>

      {/* ---- KPIs at top ---- */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ color: COLORS.muted, marginBottom: 8 }}>
          Live KPIs (read-only)
        </div>
        <div style={kpiGrid}>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Price</div>
            <div style={{ fontWeight: 700 }}>${fmt(calc.price, 2)}</div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Demand</div>
            <div style={{ fontWeight: 700 }}>{fmt(calc.demand, 0)}</div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Revenue</div>
            <div style={{ fontWeight: 700 }}>${fmt(calc.revenue, 0)}</div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Profit</div>
            <div style={{ fontWeight: 700 }}>${fmt(calc.profit, 0)}</div>
          </div>
        </div>
        <div
          style={{
            ...kpiGrid,
            marginTop: 8,
          }}
        >
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Margin</div>
            <div style={{ fontWeight: 700 }}>
              {fmt(calc.margin_pct * 100, 2)}%
            </div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Unit Margin</div>
            <div style={{ fontWeight: 700 }}>${fmt(calc.unit_margin, 2)}</div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>Total Cost</div>
            <div style={{ fontWeight: 700 }}>${fmt(calc.total_cost, 0)}</div>
          </div>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>
              Var Cost / Unit
            </div>
            <div style={{ fontWeight: 700 }}>${fmt(state.vcpu, 2)}</div>
          </div>
        </div>
      </div>

      {/* ---- Charts ---- */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ color: COLORS.muted, marginBottom: 8 }}>
          Visualizations
        </div>
        <div style={chartGrid}>
          <ChartProfit
            COLORS={COLORS}
            title="Profit vs. Price"
            series={series}
            currentPrice={state.price}
          />
          <ChartRevenue
            COLORS={COLORS}
            title="Revenue vs. Price"
            series={series}
            currentPrice={state.price}
          />
        </div>

        {/* Cost breakdown at current price */}
        <div style={{ marginTop: 16 }}>
          <CostBreakdown COLORS={COLORS} calc={calc} />
        </div>
      </div>

      {/* Scenario presets */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {["Baseline", "High FC / Low VC", "Premium Pricing"].map((s) => (
          <button
            key={s}
            onClick={() => resetScenario(s)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Inputs & Targets */}
      <div style={{ ...card, marginTop: 8 }}>
        <div style={grid}>
          {/* Price */}
          <div style={card}>
            <div style={inputRow}>
              <div>
                <div style={label}>Price</div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={1}
                  value={state.price}
                  onChange={(e) => handleEdit("price", e.target.value)}
                  style={slider}
                />
              </div>
              <input
                type="number"
                value={fmt(state.price, 2)}
                onChange={(e) => handleEdit("price", e.target.value)}
                style={number}
              />
            </div>

            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Elasticity</div>
                <input
                  type="range"
                  min={-3}
                  max={-0.1}
                  step={0.05}
                  value={state.elasticity}
                  onChange={(e) => handleEdit("elasticity", e.target.value)}
                  style={slider}
                />
              </div>
              <input
                type="number"
                value={fmt(state.elasticity, 2)}
                onChange={(e) => handleEdit("elasticity", e.target.value)}
                style={number}
              />
            </div>
          </div>

          {/* Structure */}
          <div style={card}>
            <div style={inputRow}>
              <div>
                <div style={label}>Base Price</div>
              </div>
              <input
                type="number"
                value={fmt(state.base_price, 2)}
                onChange={(e) => handleEdit("base_price", e.target.value)}
                style={number}
              />
            </div>
            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Base Demand</div>
              </div>
              <input
                type="number"
                value={fmt(state.base_demand, 0)}
                onChange={(e) => handleEdit("base_demand", e.target.value)}
                style={number}
              />
            </div>
            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Variable Cost / Unit</div>
              </div>
              <input
                type="number"
                value={fmt(state.vcpu, 2)}
                onChange={(e) => handleEdit("vcpu", e.target.value)}
                style={number}
              />
            </div>
            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Fixed Cost</div>
              </div>
              <input
                type="number"
                value={fmt(state.fixed_cost, 0)}
                onChange={(e) => handleEdit("fixed_cost", e.target.value)}
                style={number}
              />
            </div>
          </div>

          {/* Targets (edit these and the model solves for price) */}
          <div style={card}>
            <div style={inputRow}>
              <div>
                <div style={label}>Demand (units)</div>
                <small style={{ color: COLORS.muted }}>
                  Edit to target demand → solves price
                </small>
              </div>
              <input
                type="number"
                value={fmt(calc.demand, 0)}
                onChange={(e) => handleEdit("demand", e.target.value)}
                style={number}
              />
            </div>

            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Revenue</div>
                <small style={{ color: COLORS.muted }}>
                  Edit to target revenue → solves price
                </small>
              </div>
              <input
                type="number"
                value={fmt(calc.revenue, 0)}
                onChange={(e) => handleEdit("revenue", e.target.value)}
                style={number}
              />
            </div>

            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Profit</div>
                <small style={{ color: COLORS.muted }}>
                  Edit to target profit → solves price
                </small>
              </div>
              <input
                type="number"
                value={fmt(calc.profit, 0)}
                onChange={(e) => handleEdit("profit", e.target.value)}
                style={number}
              />
            </div>

            <div style={{ ...inputRow, marginTop: 10 }}>
              <div>
                <div style={label}>Margin %</div>
                <small style={{ color: COLORS.muted }}>
                  Edit to target margin → solves price
                </small>
              </div>
              <input
                type="number"
                value={fmt(calc.margin_pct * 100, 2)}
                onChange={(e) => handleEdit("margin_pct", e.target.value)}
                style={number}
              />
            </div>
          </div>
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

      {/* Tiny hint */}
      <p style={{ color: COLORS.muted, marginTop: 10, fontSize: 12 }}>
        Tip: try setting a profit target (e.g., 200000) — the model will solve a
        price that hits it.
      </p>
    </div>
  );
}

/* -------------------- Visualization Components -------------------- */

function ChartProfit({ COLORS, title, series, currentPrice }) {
  const w = 520,
    h = 220,
    pad = 32;
  const { minPrice, maxPrice, maxY, mapX, mapY } = useScales(
    series,
    w,
    h,
    pad,
    "profit"
  );
  const line = toPath(series.map((p) => [mapX(p.price), mapY(p.profit)]));

  const markerX = mapX(currentPrice);
  const markerY = mapY(yAt(series, currentPrice, "profit"));

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img">
        {/* axes */}
        <Axes
          w={w}
          h={h}
          pad={pad}
          COLORS={COLORS}
          maxY={maxY}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
        {/* curve */}
        <path d={line} fill="none" stroke={COLORS.accent} strokeWidth="2" />
        {/* current marker */}
        <line
          x1={markerX}
          x2={markerX}
          y1={pad}
          y2={h - pad}
          stroke={COLORS.border}
          strokeDasharray="4 4"
        />
        <circle cx={markerX} cy={markerY} r="4" fill={COLORS.accent} />
      </svg>
    </div>
  );
}

function ChartRevenue({ COLORS, title, series, currentPrice }) {
  const w = 520,
    h = 220,
    pad = 32;
  const { minPrice, maxPrice, maxY, mapX, mapY } = useScales(
    series,
    w,
    h,
    pad,
    "revenue"
  );
  const line = toPath(series.map((p) => [mapX(p.price), mapY(p.revenue)]));

  const markerX = mapX(currentPrice);
  const markerY = mapY(yAt(series, currentPrice, "revenue"));

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img">
        {/* axes */}
        <Axes
          w={w}
          h={h}
          pad={pad}
          COLORS={COLORS}
          maxY={maxY}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
        {/* curve */}
        <path
          d={line}
          fill="none"
          stroke={COLORS.text}
          strokeWidth="2"
          opacity="0.85"
        />
        {/* current marker */}
        <line
          x1={markerX}
          x2={markerX}
          y1={pad}
          y2={h - pad}
          stroke={COLORS.border}
          strokeDasharray="4 4"
        />
        <circle cx={markerX} cy={markerY} r="4" fill={COLORS.text} />
      </svg>
    </div>
  );
}

function CostBreakdown({ COLORS, calc }) {
  const w = 1080,
    h = 140,
    pad = 24;
  const rev = Math.max(0, calc.revenue);
  const cost = Math.max(0, calc.total_cost);
  const max = Math.max(rev, cost, 1);

  const revW = ((rev / max) * (w - pad * 2)) | 0;
  const costW = ((cost / max) * (w - pad * 2)) | 0;

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>
        Revenue vs Total Cost (current price)
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img">
        <rect
          x={pad}
          y={30}
          width={revW}
          height={22}
          fill={COLORS.accent}
          rx="6"
        />
        <text x={pad} y={26} fontSize="12" fill={COLORS.muted}>
          Revenue: ${fmt(rev, 0)}
        </text>

        <rect
          x={pad}
          y={90}
          width={costW}
          height={22}
          fill={COLORS.text}
          opacity="0.35"
          rx="6"
        />
        <text x={pad} y={86} fontSize="12" fill={COLORS.muted}>
          Total Cost: ${fmt(cost, 0)}
        </text>
      </svg>
    </div>
  );
}

/* -------------------- Chart helpers -------------------- */

function buildSeries(s) {
  // price range around base_price (0.1x .. 3x), 100 samples
  const min = Math.max(0.01, s.base_price * 0.1);
  const max = s.base_price * 3;
  const n = 100;
  const step = (max - min) / (n - 1);

  const pts = [];
  for (let i = 0; i < n; i++) {
    const price = min + i * step;
    const d = s.base_demand * Math.pow(price / s.base_price, s.elasticity);
    const revenue = price * d;
    const total_cost = s.fixed_cost + s.vcpu * d;
    const profit = revenue - total_cost;
    pts.push({ price, revenue, profit });
  }
  return pts;
}

function useScales(series, w, h, pad, key) {
  const minPrice = Math.min(...series.map((p) => p.price));
  const maxPrice = Math.max(...series.map((p) => p.price));
  const maxY = Math.max(...series.map((p) => Math.max(0, p[key]))); // clamp below 0 for domain
  const minY = Math.min(0, Math.min(...series.map((p) => p[key])));

  const mapX = (price) =>
    pad + ((price - minPrice) / (maxPrice - minPrice)) * (w - pad * 2);
  const mapY = (val) =>
    // y grows downward; map minY..maxY into h-pad..pad
    h - pad - ((val - minY) / (maxY - minY || 1)) * (h - pad * 2);

  return { minPrice, maxPrice, maxY, minY, mapX, mapY };
}

function toPath(points) {
  if (!points.length) return "";
  return points.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(" ");
}

function yAt(series, xPrice, key) {
  // nearest-neighbor lookup for marker
  let best = series[0],
    bestDist = Math.abs(xPrice - series[0].price);
  for (let i = 1; i < series.length; i++) {
    const d = Math.abs(xPrice - series[i].price);
    if (d < bestDist) {
      best = series[i];
      bestDist = d;
    }
  }
  return best[key];
}

function Axes({ w, h, pad, COLORS, maxY, minPrice, maxPrice }) {
  const x1 = pad,
    x2 = w - pad,
    y = h - pad;
  const y1 = pad,
    y2 = h - pad,
    x = pad;

  return (
    <g>
      {/* axes */}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={COLORS.border} />
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={COLORS.border} />

      {/* ticks */}
      {Array.from({ length: 5 }).map((_, i) => {
        const t = i / 4;
        const px = x1 + t * (x2 - x1);
        const price = minPrice + t * (maxPrice - minPrice);
        return (
          <g key={i}>
            <line x1={px} y1={y} x2={px} y2={y + 4} stroke={COLORS.border} />
            <text
              x={px}
              y={y + 16}
              fontSize="10"
              textAnchor="middle"
              fill={COLORS.muted}
            >
              ${fmt(price, 0)}
            </text>
          </g>
        );
      })}
      {/* y max label */}
      <text
        x={x}
        y={y1 - 6}
        fontSize="10"
        textAnchor="start"
        fill={COLORS.muted}
      >
        {`Max: $${fmt(maxY, 0)}`}
      </text>
    </g>
  );
}

/* -------------------- Math helpers -------------------- */

// compute everything from the current state
function deriveAll(s) {
  const demand = s.base_demand * Math.pow(s.price / s.base_price, s.elasticity);
  const revenue = s.price * demand;
  const var_cost_total = s.vcpu * demand;
  const total_cost = s.fixed_cost + var_cost_total;
  const profit = revenue - total_cost;
  const margin_pct = revenue > 0 ? profit / revenue : 0;
  const unit_margin = s.price - s.vcpu;

  return {
    price: s.price,
    demand,
    revenue,
    total_cost,
    var_cost_total,
    profit,
    margin_pct,
    unit_margin,
  };
}

// invert elasticity equation to find price given demand
function invertElasticityForPrice(demand, base_demand, base_price, elasticity) {
  // demand = base_demand * (price / base_price) ^ elasticity
  // (demand / base_demand) = (price / base_price)^elasticity
  // price = base_price * (demand / base_demand)^(1/elasticity)
  const ratio = clamp(demand / base_demand, 1e-12, 1e12);
  const inv = 1 / elasticity; // negative → flip
  const price = base_price * Math.pow(ratio, inv);
  return clamp(price, 0.01, 1e6);
}

// solve for price that achieves target revenue
function solvePriceForRevenue(
  targetRevenue,
  base_demand,
  base_price,
  elasticity
) {
  const f = (p) =>
    p * base_demand * Math.pow(p / base_price, elasticity) - targetRevenue;
  return bisectPrice(f, 0.01, base_price * 100, 60);
}

// solve for price that achieves target profit
function solvePriceForProfit(
  targetProfit,
  base_demand,
  base_price,
  elasticity,
  vcpu,
  fixed_cost
) {
  const f = (p) => {
    const d = base_demand * Math.pow(p / base_price, elasticity);
    const revenue = p * d;
    const total_cost = fixed_cost + vcpu * d;
    return revenue - total_cost - targetProfit;
  };
  return bisectPrice(f, 0.01, base_price * 100, 60);
}

// solve for price that achieves target margin (profit / revenue)
function solvePriceForMargin(
  targetMargin,
  base_demand,
  base_price,
  elasticity,
  vcpu,
  fixed_cost
) {
  const m = clamp(targetMargin, -5, 5); // broad but sane
  const f = (p) => {
    const d = base_demand * Math.pow(p / base_price, elasticity);
    const revenue = p * d;
    const total_cost = fixed_cost + vcpu * d;
    const profit = revenue - total_cost;
    const margin = revenue > 0 ? profit / revenue : -1;
    return margin - m;
  };
  return bisectPrice(f, 0.01, base_price * 200, 70);
}

// simple binary search root finder on [lo, hi]
function bisectPrice(f, lo, hi, iters = 50) {
  // Ensure bracketed root by expanding bounds if needed
  let a = lo,
    b = hi;
  let fa = f(a),
    fb = f(b);
  let expand = 0;
  while (fa * fb > 0 && expand < 10) {
    // expand outward multiplicatively
    a = Math.max(0.01, a / 2);
    b = b * 2;
    fa = f(a);
    fb = f(b);
    expand++;
  }
  // If still not bracketed, just return mid as best effort
  if (fa * fb > 0) return clamp((a + b) / 2, 0.01, 1e6);

  for (let i = 0; i < iters; i++) {
    const mid = 0.5 * (a + b);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-6) return clamp(mid, 0.01, 1e6);
    // choose side that changes sign
    if (fa * fm < 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return clamp(0.5 * (a + b), 0.01, 1e6);
}

// utils
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
}
function toNumberSafe(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function fmt(v, digits = 0) {
  if (!Number.isFinite(v)) return "";
  const f = Number(v.toFixed(digits));
  return digits === 0
    ? f.toLocaleString()
    : f.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
}
