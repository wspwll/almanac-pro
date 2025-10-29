// src/pages/ProductSentiments.jsx
import React, { useMemo, useState } from "react";

/**
 * Product Sentiments (rev + Demographic Filters)
 * - NEW: DemographicFilters bar above everything
 * - Top selection bar with toggle buttons (multi-select)
 * - For each selected model (stacked vertically):
 *    • Left: Sunburst (Overall → Category → Statements)
 *    • Right: Category bars with per-category expand to show statement scores
 *
 * Props from app shell: { COLORS, useStyles }
 */

export default function ProductSentiments({ COLORS, useStyles }) {
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

  // ---- Demo dataset for requested models
  const MODELS = useMemo(
    () => [
      makeModel("Ford Bronco", 78, [
        cat("Design", 0.2, 82, [
          stmt("Exterior styling", 0.35, 85),
          stmt("Interior materials", 0.25, 78),
          stmt("Color/trim options", 0.2, 80),
          stmt("Fit & finish", 0.2, 82),
        ]),
        cat("Performance", 0.22, 80, [
          stmt("Acceleration", 0.3, 82),
          stmt("Handling", 0.3, 79),
          stmt("Braking", 0.2, 78),
          stmt("Range/MPG", 0.2, 76),
        ]),
        cat("Comfort", 0.16, 74, [
          stmt("Seat comfort", 0.3, 75),
          stmt("Ride quality", 0.35, 73),
          stmt("Cabin noise", 0.2, 72),
          stmt("Climate controls", 0.15, 76),
        ]),
        cat("Technology", 0.18, 76, [
          stmt("Infotainment UX", 0.35, 78),
          stmt("Navigation", 0.25, 74),
          stmt("Driver assist", 0.25, 75),
          stmt("App/Connectivity", 0.15, 77),
        ]),
        cat("Value", 0.12, 75, [
          stmt("Price vs features", 0.45, 76),
          stmt("Resale expectations", 0.25, 73),
          stmt("Maintenance costs", 0.3, 75),
        ]),
        cat("Reliability", 0.12, 80, [
          stmt("Build reliability", 0.45, 81),
          stmt("Software stability", 0.3, 77),
          stmt("Warranty experience", 0.25, 82),
        ]),
      ]),
      makeModel("Toyota 4Runner", 82, [
        cat("Design", 0.17, 78, [
          stmt("Exterior styling", 0.35, 79),
          stmt("Interior materials", 0.25, 76),
          stmt("Color/trim options", 0.2, 77),
          stmt("Fit & finish", 0.2, 80),
        ]),
        cat("Performance", 0.2, 79, [
          stmt("Acceleration", 0.3, 77),
          stmt("Handling", 0.3, 78),
          stmt("Braking", 0.2, 79),
          stmt("Range/MPG", 0.2, 82),
        ]),
        cat("Comfort", 0.18, 80, [
          stmt("Seat comfort", 0.3, 81),
          stmt("Ride quality", 0.35, 79),
          stmt("Cabin noise", 0.2, 80),
          stmt("Climate controls", 0.15, 80),
        ]),
        cat("Technology", 0.16, 74, [
          stmt("Infotainment UX", 0.35, 74),
          stmt("Navigation", 0.25, 73),
          stmt("Driver assist", 0.25, 74),
          stmt("App/Connectivity", 0.15, 74),
        ]),
        cat("Value", 0.14, 85, [
          stmt("Price vs features", 0.45, 86),
          stmt("Resale expectations", 0.25, 88),
          stmt("Maintenance costs", 0.3, 82),
        ]),
        cat("Reliability", 0.15, 90, [
          stmt("Build reliability", 0.45, 92),
          stmt("Software stability", 0.3, 86),
          stmt("Warranty experience", 0.25, 90),
        ]),
      ]),
      makeModel("Rivian R1S", 85, [
        cat("Design", 0.22, 90, [
          stmt("Exterior styling", 0.35, 92),
          stmt("Interior materials", 0.25, 89),
          stmt("Color/trim options", 0.2, 88),
          stmt("Fit & finish", 0.2, 90),
        ]),
        cat("Performance", 0.22, 92, [
          stmt("Acceleration", 0.3, 95),
          stmt("Handling", 0.3, 92),
          stmt("Braking", 0.2, 90),
          stmt("Range/MPG", 0.2, 89),
        ]),
        cat("Comfort", 0.16, 84, [
          stmt("Seat comfort", 0.3, 86),
          stmt("Ride quality", 0.35, 83),
          stmt("Cabin noise", 0.2, 82),
          stmt("Climate controls", 0.15, 85),
        ]),
        cat("Technology", 0.2, 88, [
          stmt("Infotainment UX", 0.35, 90),
          stmt("Navigation", 0.25, 87),
          stmt("Driver assist", 0.25, 88),
          stmt("App/Connectivity", 0.15, 88),
        ]),
        cat("Value", 0.1, 74, [
          stmt("Price vs features", 0.45, 75),
          stmt("Resale expectations", 0.25, 73),
          stmt("Maintenance costs", 0.3, 74),
        ]),
        cat("Reliability", 0.1, 78, [
          stmt("Build reliability", 0.45, 80),
          stmt("Software stability", 0.3, 75),
          stmt("Warranty experience", 0.25, 79),
        ]),
      ]),
      makeModel("Tesla Model Y", 81, [
        cat("Design", 0.18, 80, [
          stmt("Exterior styling", 0.35, 82),
          stmt("Interior materials", 0.25, 76),
          stmt("Color/trim options", 0.2, 78),
          stmt("Fit & finish", 0.2, 77),
        ]),
        cat("Performance", 0.24, 91, [
          stmt("Acceleration", 0.3, 95),
          stmt("Handling", 0.3, 90),
          stmt("Braking", 0.2, 88),
          stmt("Range/MPG", 0.2, 90),
        ]),
        cat("Comfort", 0.16, 79, [
          stmt("Seat comfort", 0.3, 79),
          stmt("Ride quality", 0.35, 78),
          stmt("Cabin noise", 0.2, 80),
          stmt("Climate controls", 0.15, 79),
        ]),
        cat("Technology", 0.22, 87, [
          stmt("Infotainment UX", 0.35, 90),
          stmt("Navigation", 0.25, 85),
          stmt("Driver assist", 0.25, 87),
          stmt("App/Connectivity", 0.15, 86),
        ]),
        cat("Value", 0.1, 73, [
          stmt("Price vs features", 0.45, 74),
          stmt("Resale expectations", 0.25, 72),
          stmt("Maintenance costs", 0.3, 73),
        ]),
        cat("Reliability", 0.1, 70, [
          stmt("Build reliability", 0.45, 70),
          stmt("Software stability", 0.3, 68),
          stmt("Warranty experience", 0.25, 72),
        ]),
      ]),
      makeModel("Jeep Wrangler", 76, [
        cat("Design", 0.22, 86, [
          stmt("Exterior styling", 0.35, 90),
          stmt("Interior materials", 0.25, 78),
          stmt("Color/trim options", 0.2, 84),
          stmt("Fit & finish", 0.2, 82),
        ]),
        cat("Performance", 0.24, 78, [
          stmt("Acceleration", 0.3, 76),
          stmt("Handling", 0.3, 74),
          stmt("Braking", 0.2, 77),
          stmt("Range/MPG", 0.2, 84),
        ]),
        cat("Comfort", 0.14, 68, [
          stmt("Seat comfort", 0.3, 70),
          stmt("Ride quality", 0.35, 64),
          stmt("Cabin noise", 0.2, 66),
          stmt("Climate controls", 0.15, 70),
        ]),
        cat("Technology", 0.14, 70, [
          stmt("Infotainment UX", 0.35, 72),
          stmt("Navigation", 0.25, 68),
          stmt("Driver assist", 0.25, 70),
          stmt("App/Connectivity", 0.15, 69),
        ]),
        cat("Value", 0.14, 77, [
          stmt("Price vs features", 0.45, 78),
          stmt("Resale expectations", 0.25, 80),
          stmt("Maintenance costs", 0.3, 73),
        ]),
        cat("Reliability", 0.12, 74, [
          stmt("Build reliability", 0.45, 75),
          stmt("Software stability", 0.3, 72),
          stmt("Warranty experience", 0.25, 75),
        ]),
      ]),
    ],
    []
  );

  // ---- Selection state (preselect first two)
  const [selected, setSelected] = useState(() => MODELS.map((_, i) => i < 2));

  // ---- NEW: Demographic filter state
  const [demo, setDemo] = useState({
    ageRange: "", // e.g., "18-24","25-34","35-44","45-54","55-64","65+"
    gender: "", // "Female","Male","Non-binary","Other"
    maritalStatus: "", // "Single","Married/Partnered","Divorced/Separated","Widowed"
    numKids: "", // "0","1","2","3+"
    lifeStage: "", // "Young Single","Young Family","Maturing Family","Established","Empty Nester","Retired"
    education: "", // "HS or less","Some college","Bachelor's","Graduate+"
    householdIncome: "", // optional: "<$50k","$50-100k","$100-150k","$150k+"
  });

  // ---- Apply demographic adjustments (lightweight demo logic)
  const adjustedModels = useMemo(() => {
    const active = MODELS.filter((_, i) => selected[i]);
    return active.map((m) => applyDemographicAdjustments(m, demo));
  }, [MODELS, selected, demo]);

  // ---- Styles
  const card = {
    background: COLORS.panel,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
  };

  const topBar = {
    ...card,
    display: "grid",
    gap: 10,
  };

  const buttonRow = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  };

  const toggleBtn = (isOn) => ({
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${isOn ? COLORS.accent : COLORS.border}`,
    background: isOn ? COLORS.linkActiveBg : "transparent",
    color: COLORS.text,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  });

  const smallBtn = {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.text,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  };

  const listStack = {
    ...card,
    marginTop: 12,
    display: "grid",
    gap: 16,
  };

  return (
    <div>
      <div
        style={{
          ...card,
          background: "transparent",
          border: "none",
          padding: 18, // keep left edge aligned with other cards
          display: "grid",
          gap: 10,
        }}
      >
        <h1 style={{ ...styles.h1, margin: 0 }}>
          <span
            style={{ color: COLORS.accent, transition: "color 120ms ease" }}
          >
            Product Sentiments
          </span>
        </h1>

        <p style={{ color: COLORS.muted, margin: 0 }}>
          Compare how customers feel about their vehicle purchase. Drill from
          the <em>overall score</em> into <em>category</em> and{" "}
          <em>statement</em> contributions. Use demographic filters to view
          custom-defined groups, then select models to compare.
        </p>
      </div>

      {/* ---- NEW: Demographic Filters (above model selection) ---- */}
      <DemographicFilters COLORS={COLORS} demo={demo} setDemo={setDemo} />

      {/* ---- Model selection at the TOP ---- */}
      <div style={{ ...topBar, marginTop: 12 }}>
        <div style={{ fontWeight: 700 }}>Select models</div>
        <div style={buttonRow}>
          {MODELS.map((m, i) => {
            const isOn = selected[i];
            return (
              <button
                key={m.id}
                type="button"
                style={toggleBtn(isOn)}
                onClick={() =>
                  setSelected((prev) =>
                    prev.map((v, idx) => (idx === i ? !v : v))
                  )
                }
                title={`${m.name} — overall ${m.overall}`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={smallBtn}
            onClick={() => setSelected(MODELS.map(() => true))}
          >
            Select All
          </button>
          <button
            type="button"
            style={smallBtn}
            onClick={() => setSelected(MODELS.map(() => false))}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ---- Models stacked vertically ---- */}
      <div style={listStack}>
        {adjustedModels.length === 0 ? (
          <EmptyState COLORS={COLORS} />
        ) : (
          adjustedModels.map((model) => (
            <ModelRow key={model.id} model={model} COLORS={COLORS} />
          ))
        )}
      </div>

      {/* Signature */}
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
    </div>
  );
}

/* -------------------- NEW: Demographic Filters -------------------- */

function DemographicFilters({ COLORS, demo, setDemo }) {
  const wrap = {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
    display: "grid",
    gap: 12,
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  };
  const labelStyle = { fontSize: 12, color: COLORS.muted, marginBottom: 6 };
  const select = {
    width: "100%",
    padding: "8px 10px",
    background: "transparent",
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    outline: "none",
  };

  const handle = (key) => (e) =>
    setDemo((d) => ({ ...d, [key]: e.target.value }));

  return (
    <div style={wrap}>
      <div style={{ fontWeight: 700 }}>Demographic Filters</div>
      <div style={grid}>
        <Field label="Age range">
          <select
            value={demo.ageRange}
            onChange={handle("ageRange")}
            style={select}
          >
            <option value="">All</option>
            <option value="18-24">18–24</option>
            <option value="25-34">25–34</option>
            <option value="35-44">35–44</option>
            <option value="45-54">45–54</option>
            <option value="55-64">55–64</option>
            <option value="65+">65+</option>
          </select>
        </Field>

        <Field label="Gender">
          <select
            value={demo.gender}
            onChange={handle("gender")}
            style={select}
          >
            <option value="">All</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </Field>

        <Field label="Marital status">
          <select
            value={demo.maritalStatus}
            onChange={handle("maritalStatus")}
            style={select}
          >
            <option value="">All</option>
            <option value="Single">Single</option>
            <option value="Married/Partnered">Married/Partnered</option>
            <option value="Divorced/Separated">Divorced/Separated</option>
            <option value="Widowed">Widowed</option>
          </select>
        </Field>

        <Field label="Number of kids">
          <select
            value={demo.numKids}
            onChange={handle("numKids")}
            style={select}
          >
            <option value="">All</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </Field>

        <Field label="Household life stage">
          <select
            value={demo.lifeStage}
            onChange={handle("lifeStage")}
            style={select}
          >
            <option value="">All</option>
            <option value="Young Single">Young Single</option>
            <option value="Young Family">Young Family</option>
            <option value="Maturing Family">Maturing Family</option>
            <option value="Established">Established</option>
            <option value="Empty Nester">Empty Nester</option>
            <option value="Retired">Retired</option>
          </select>
        </Field>

        <Field label="Education level">
          <select
            value={demo.education}
            onChange={handle("education")}
            style={select}
          >
            <option value="">All</option>
            <option value="HS or less">HS or less</option>
            <option value="Some college">Some college</option>
            <option value="Bachelor's">Bachelor&apos;s</option>
            <option value="Graduate+">Graduate+</option>
          </select>
        </Field>

        <Field label="Household income (optional)">
          <select
            value={demo.householdIncome}
            onChange={handle("householdIncome")}
            style={select}
          >
            <option value="">All</option>
            <option value="<$50k">&lt;$50k</option>
            <option value="$50-100k">$50–100k</option>
            <option value="$100-150k">$100–150k</option>
            <option value="$150k+">$150k+</option>
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={() =>
            setDemo({
              ageRange: "",
              gender: "",
              maritalStatus: "",
              numKids: "",
              lifeStage: "",
              education: "",
              householdIncome: "",
            })
          }
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${COLORS.border}`,
            background: "transparent",
            color: COLORS.text,
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );

  function Field({ label: labelText, children }) {
    return (
      <label style={{ display: "grid" }}>
        <span style={labelStyle}>{labelText}</span>
        {children}
      </label>
    );
  }
}

/* -------------------- Model Row (Horizontal layout) -------------------- */

function ModelRow({ model, COLORS }) {
  // simple responsive two-column grid: left sunburst, right category/accordion
  const rowGrid = {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 380px) 1fr",
    gap: 16,
    alignItems: "stretch",
  };

  const panel = {
    background: "transparent",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 12,
    minWidth: 0,
    boxSizing: "border-box",
    display: "grid",
    gridTemplateRows: "auto 1fr",
  };

  return (
    <div style={rowGrid}>
      {/* Left: Sunburst */}
      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>{model.name}</strong>
          <span style={{ color: COLORS.muted }}>
            Overall:{" "}
            <strong style={{ color: COLORS.accent }}>{model.overall}</strong>
          </span>
        </div>
        <div style={{ marginTop: 8, minHeight: 0 }}>
          <Sunburst model={model} COLORS={COLORS} fillHeight />
        </div>
      </div>

      {/* Right: Category bars + expandable statements */}
      <div style={panel}>
        <div style={{ color: COLORS.muted, marginBottom: 6 }}>
          Category scores (click to expand)
        </div>
        <CategoryAccordion model={model} COLORS={COLORS} />
      </div>
    </div>
  );
}

/* -------------------- Category Accordion -------------------- */

function CategoryAccordion({ model, COLORS }) {
  const [openIdx, setOpenIdx] = useState(null);
  const totalW = sum(model.categories.map((c) => c.weight));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {model.categories.map((c, idx) => {
        const pct = c.score;
        const isOpen = openIdx === idx;

        return (
          <div
            key={c.name}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* Header row (category) */}
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              aria-expanded={isOpen}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: COLORS.text,
                textAlign: "left",
                padding: "10px 12px",
                cursor: "pointer",
              }}
              title={`Toggle ${c.name}`}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </strong>
                  <span style={{ color: COLORS.muted, fontSize: 12 }}>
                    • wt. {Math.round(c.weight * 100)}%
                  </span>
                </div>

                <div style={{ color: COLORS.muted, fontWeight: 600 }}>
                  {pct}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: COLORS.border,
                  overflow: "hidden",
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: COLORS.accent,
                    opacity: 0.7,
                  }}
                />
              </div>

              <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>
                Est. contribution to overall:{" "}
                {((c.weight / totalW) * model.overall).toFixed(1)}
              </div>
            </button>

            {/* Expanded statement list */}
            {isOpen && (
              <div
                style={{ padding: "8px 12px 12px", display: "grid", gap: 8 }}
              >
                {c.statements.map((s, i) => (
                  <div
                    key={s.name + i}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(140px,1fr) minmax(120px,0.8fr) 70px",
                      gap: 8,
                      alignItems: "center",
                    }}
                    title={`${s.name} — ${s.score}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          borderRadius: 999,
                          background: COLORS.border,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: `${s.score}%`,
                            height: "100%",
                            background: COLORS.accent,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </div>
                    </div>

                    <div
                      style={{
                        color: COLORS.muted,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.name}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <strong>{s.score}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Sunburst (SVG) -------------------- */

function Sunburst({ model, COLORS, fillHeight = false }) {
  const w = 320;
  const h = 320;
  const cx = w / 2;
  const cy = h / 2;
  const r0 = 28; // inner chip
  const band = 40;
  const ring0 = [r0, r0 + band];
  const ring1 = [r0 + band + 6, r0 + band * 2 + 6];
  const ring2 = [r0 + band * 2 + 12, r0 + band * 3 + 12];

  function colorFor(score) {
    const t = clamp01((score - 60) / 40); // 60..100
    return `rgba(255,84,50,${0.35 + 0.35 * t})`;
  }

  const totalCatWeight = sum(model.categories.map((c) => c.weight));
  const overallFill = colorFor(model.overall);
  const catSegs = letCatAngles(model.categories, totalCatWeight);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      style={{
        width: "100%",
        height: fillHeight ? "100%" : "auto",
        display: "block",
      }}
    >
      {/* Ring 0: overall */}
      <g>
        <path
          d={arcPath(cx, cy, ring0[0], ring0[1], 0, Math.PI * 2)}
          fill={overallFill}
          stroke={COLORS.border}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fill={COLORS.text}
        >
          {model.overall}
        </text>
      </g>

      {/* Ring 1: categories */}
      <g>
        {catSegs.map((seg) => {
          const c = seg.cat;
          return (
            <g key={c.name}>
              <path
                d={arcPath(cx, cy, ring1[0], ring1[1], seg.a0, seg.a1)}
                fill={colorFor(c.score)}
                stroke={COLORS.border}
              />
              {labelAlongArc(
                cx,
                cy,
                (ring1[0] + ring1[1]) / 2,
                seg.a0,
                seg.a1,
                c.name,
                COLORS
              )}
            </g>
          );
        })}
      </g>

      {/* Ring 2: statements */}
      <g>
        {renderStatementPaths({
          categories: model.categories,
          catSegs,
          cx,
          cy,
          rInner: ring2[0],
          rOuter: ring2[1],
          COLORS,
        })}
      </g>
    </svg>
  );
}

/* -------------------- Sunburst helpers -------------------- */

function letCatAngles(categories, totalW) {
  let acc = -Math.PI / 2; // start at top
  return categories.map((cat) => {
    const a0 = acc;
    const da = (cat.weight / totalW) * Math.PI * 2;
    const a1 = a0 + da;
    acc = a1;
    return { cat, a0, a1 };
  });
}

function renderStatementPaths({
  categories,
  catSegs,
  cx,
  cy,
  rInner,
  rOuter,
  COLORS,
}) {
  const paths = [];
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const seg = catSegs[i];
    const totalStmtW = sum(c.statements.map((s) => s.weight));
    let sA0 = seg.a0;
    c.statements.forEach((s) => {
      const sDa = (s.weight / totalStmtW) * (seg.a1 - seg.a0);
      const sA1 = sA0 + sDa;
      const opacity = 0.35 + 0.35 * clamp01((s.score - 60) / 40);
      const stroke = s.score >= 85 ? `${COLORS.text}55` : "none";
      paths.push(
        <path
          key={`stmt-${c.name}-${s.name}`}
          d={arcPath(cx, cy, rInner, rOuter, sA0, sA1)}
          fill={`rgba(255,84,50,${opacity})`}
          stroke={stroke}
        />
      );
      sA0 = sA1;
    });
  }
  return paths;
}

function labelAlongArc(cx, cy, r, a0, a1, text, COLORS) {
  const am = (a0 + a1) / 2;
  const p = polar(cx, cy, r, am);
  const ta = Math.cos(am) < 0 ? "end" : Math.cos(am) > 0 ? "start" : "middle";
  const db = Math.sin(am) < 0 ? "text-after-edge" : "text-before-edge";
  return (
    <text
      x={p.x}
      y={p.y}
      fontSize="10"
      fill={COLORS.muted}
      textAnchor={ta}
      dominantBaseline={db}
      style={{ pointerEvents: "none" }}
    >
      {text}
    </text>
  );
}

/* -------------------- Empty state -------------------- */

function EmptyState({ COLORS }) {
  return (
    <div
      style={{
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        color: COLORS.muted,
      }}
    >
      Select one or more models above to compare.
    </div>
  );
}

/* -------------------- Geometry helpers -------------------- */

function arcPath(cx, cy, rInner, rOuter, a0, a1) {
  const aStart = a0;
  const aEnd = a1;
  const large = Math.abs(aEnd - aStart) > Math.PI ? 1 : 0;

  const p0 = polar(cx, cy, rOuter, aStart);
  const p1 = polar(cx, cy, rOuter, aEnd);
  const p2 = polar(cx, cy, rInner, aEnd);
  const p3 = polar(cx, cy, rInner, aStart);

  return [
    "M",
    p0.x,
    p0.y,
    "A",
    rOuter,
    rOuter,
    0,
    large,
    1,
    p1.x,
    p1.y,
    "L",
    p2.x,
    p2.y,
    "A",
    rInner,
    rInner,
    0,
    large,
    0,
    p3.x,
    p3.y,
    "Z",
  ].join(" ");
}

function polar(cx, cy, r, a) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/* -------------------- Utils -------------------- */

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}
function clampScore(x) {
  return Math.max(0, Math.min(100, Math.round(x)));
}

/* -------------------- Data builders -------------------- */

function makeModel(name, overall, categories) {
  return {
    id: name.replace(/\s+/g, "-").toLowerCase(),
    name,
    overall,
    categories,
  };
}
function cat(name, weight, score, statements) {
  return { name, weight, score, statements };
}
function stmt(name, weight, score) {
  return { name, weight, score };
}

/* -------------------- NEW: Demographic adjustment engine -------------------- */
/**
 * applyDemographicAdjustments(model, demo)
 * Lightweight demo logic:
 * - Applies small, targeted +/- adjustments by category based on selected filters.
 * - Recomputes overall as weighted average of adjusted category scores.
 *
 * Swap this out for real filtered slices when you connect survey data.
 */
function applyDemographicAdjustments(model, demo) {
  // Category-level deltas initialized to 0
  const delta = {
    Design: 0,
    Performance: 0,
    Comfort: 0,
    Technology: 0,
    Value: 0,
    Reliability: 0,
  };

  // Age
  switch (demo.ageRange) {
    case "18-24":
    case "25-34":
      delta.Technology += 2;
      delta.Design += 1;
      break;
    case "35-44":
    case "45-54":
      delta.Comfort += 1;
      delta.Value += 1;
      break;
    case "55-64":
    case "65+":
      delta.Comfort += 2;
      delta.Reliability += 1;
      break;
    default:
      break;
  }

  // Gender
  switch (demo.gender) {
    case "Female":
      delta.Comfort += 1;
      delta.Technology += 1;
      break;
    case "Male":
      delta.Performance += 1;
      delta.Design += 1;
      break;
    default:
      break;
  }

  // Marital status
  if (demo.maritalStatus === "Married/Partnered") delta.Value += 1;
  if (demo.maritalStatus === "Single") delta.Design += 1;

  // Number of kids
  if (demo.numKids === "2" || demo.numKids === "3+") {
    delta.Comfort += 2;
    delta.Value += 1;
  } else if (demo.numKids === "1") {
    delta.Comfort += 1;
  }

  // Life stage
  if (
    demo.lifeStage === "Young Family" ||
    demo.lifeStage === "Maturing Family"
  ) {
    delta.Comfort += 2;
    delta.Value += 1;
  }
  if (demo.lifeStage === "Empty Nester" || demo.lifeStage === "Retired") {
    delta.Reliability += 2;
  }

  // Education
  if (demo.education === "Graduate+") {
    delta.Technology += 1;
  }

  // Income
  if (demo.householdIncome === "<$50k") delta.Value += 2;
  if (demo.householdIncome === "$150k+") delta.Design += 1;

  // Build adjusted categories & statements
  const adjCategories = model.categories.map((c) => {
    const add = delta[c.name] ?? 0;
    const newScore = clampScore(c.score + add);

    // statements get a tempered version of the category delta
    const sAdj = add * 0.7;
    const newStatements = c.statements.map((s) => ({
      ...s,
      score: clampScore(s.score + sAdj),
    }));

    return { ...c, score: newScore, statements: newStatements };
  });

  // Recompute overall as weighted average of adjusted categories
  const totalW = sum(adjCategories.map((c) => c.weight));
  const newOverall =
    totalW > 0
      ? clampScore(
          adjCategories.reduce((acc, c) => acc + c.score * c.weight, 0) / totalW
        )
      : model.overall;

  return { ...model, categories: adjCategories, overall: newOverall };
}
