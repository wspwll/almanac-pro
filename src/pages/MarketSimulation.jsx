// src/pages/MarketSimulation.jsx
import React, { useMemo, useState } from "react";

/**
 * Market Simulation (Segments / Powertrains)
 * - Segment pills: SUVs (S/M/L/XL) over Pickups (S/M/L/XL), compact chips
 * - KPIs + Segments line chart:
 *    • Legend (top), taller chart, precise hover mapping
 *    • Tooltip shows Month/Year + per-segment volumes
 *    • Vertical hover guide + persistent selected guide on click
 *    • Date range selectors (Start/End) + Reset range
 *    • Clear selected month button
 * - Clicking a month applies that month’s (dummy) values to the cards below
 * - KPIs recompute based on the visible date range in Segments mode
 * - FUTURE: range extends to 2040-01; portions after 2025-08 render dashed if range crosses into future
 */

export default function MarketSimulation({ COLORS, useStyles }) {
  const styles = useStyles(COLORS);
  // Style for <option> elements inside dark mode dropdowns
  const optionStyle = {
    background: COLORS.panel,
    color: COLORS.text,
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

  const sigSrc = isDarkHex(COLORS.panel)
    ? "/signature-fog.png"
    : "/signature-moonstone.png";

  /* -------------------- Definitions -------------------- */

  const PICKUP_BLUE = "#60B6FF"; // light blue for pickups (pairs with #FF5432)
  const suvAccent = COLORS.accent;

  const MODES = {
    segments: {
      label: "Segments",
      keys: [
        "S SUV",
        "M SUV",
        "L SUV",
        "XL SUV",
        "S Pickup",
        "M Pickup",
        "L Pickup",
        "XL Pickup",
      ],
      baselines: {
        // (atp, fleetPct, leasePct, days, incentives, monthNum, baseVol)
        "S SUV": basePack(38_000, 10_000, 14, 50, 750, 6, 24_000),
        "M SUV": basePack(45_000, 12_000, 16, 55, 1_000, 6, 40_000),
        "L SUV": basePack(54_000, 14_000, 18, 60, 1_500, 6, 28_000),
        "XL SUV": basePack(62_000, 16_000, 20, 65, 2_000, 6, 16_000),
        "S Pickup": basePack(42_000, 11_000, 13, 55, 700, 6, 20_000),
        "M Pickup": basePack(50_000, 13_000, 15, 60, 1_100, 6, 36_000),
        "L Pickup": basePack(58_000, 15_000, 17, 65, 1_600, 6, 26_000),
        "XL Pickup": basePack(66_000, 17_000, 19, 70, 2_200, 6, 14_000),
      },
    },
    powertrains: {
      label: "Powertrains",
      keys: ["ICE", "HEV", "PHEV", "BEV"],
      baselines: {
        ICE: basePack(40_000, 9_000, 15, 55, 750, 6, 70_000),
        HEV: basePack(44_000, 12_000, 17, 50, 1_000, 6, 28_000),
        PHEV: basePack(50_000, 15_000, 18, 60, 1_500, 6, 14_000),
        BEV: basePack(48_000, 10_000, 20, 65, 2_500, 6, 18_000),
      },
    },
  };

  // Response model coefficients
  const COEFFS = {
    E_PRICE: -1.1,
    B_FLEET_PER10PP: 0.06,
    B_LEASE_PER10PP: 0.04,
    B_INCENTIVES_PER_K: 0.05,
    B_DAYS_PER10: -0.05,
  };

  function basePack(
    atp,
    fleetPct,
    leasePct,
    days,
    incentives,
    monthNum,
    baseVol
  ) {
    return {
      price: atp,
      fleet: fleetPct,
      lease: leasePct,
      days,
      incentives,
      month: monthNum,
      base_volume: baseVol,
    };
  }

  function getRangeBounds() {
    const rs = Math.max(
      0,
      Math.min(rangeStartIdx ?? 0, segmentProfiles.monthTicks.length - 1)
    );
    const re = Math.max(
      rs,
      Math.min(
        rangeEndIdx ?? segmentProfiles.monthTicks.length - 1,
        segmentProfiles.monthTicks.length - 1
      )
    );
    return [rs, re];
  }

  function rangeStatsForKey(key, rs, re) {
    const prof = segmentProfiles.profileByKey[key];
    if (!prof) {
      return {
        avgPrice: 0,
        avgFleet: 0,
        avgLease: 0,
        avgDays: 0,
        avgIncentives: 0,
        totalVolume: 0,
      };
    }

    let sumVol = 0,
      sumPriceVol = 0,
      sumFleetVol = 0,
      sumLeaseVol = 0,
      sumDaysVol = 0,
      sumIncVol = 0;

    for (let i = rs; i <= re; i++) {
      const v = prof.volume[i]?.v ?? 0;
      sumVol += v;
      sumPriceVol += (prof.price[i] ?? 0) * v;
      sumFleetVol += (prof.fleet[i] ?? 0) * v;
      sumLeaseVol += (prof.lease[i] ?? 0) * v;
      sumDaysVol += (prof.days[i] ?? 0) * v;
      sumIncVol += (prof.incentives[i] ?? 0) * v;
    }

    const vw = (s) => (sumVol > 0 ? s / sumVol : 0);

    return {
      avgPrice: Math.round(vw(sumPriceVol)),
      avgFleet: Math.round(vw(sumFleetVol)),
      avgLease: Math.round(vw(sumLeaseVol)),
      avgDays: Math.round(vw(sumDaysVol)),
      avgIncentives: Math.round(vw(sumIncVol)),
      totalVolume: Math.round(sumVol),
    };
  }

  function clearSelectedMonthToRange() {
    const [rs, re] = getRangeBounds();
    setEdits((prev) => {
      const next = { ...prev };
      for (const key of selected) {
        const stats = rangeStatsForKey(key, rs, re);
        next[key] = {
          ...(next[key] || {}),
          price: stats.avgPrice,
          fleet: stats.avgFleet,
          lease: stats.avgLease,
          days: stats.avgDays,
          incentives: stats.avgIncentives,
          // month intentionally omitted
        };
      }
      return next;
    });
    setSelectedMonthIdx(null);
  }

  /* -------------------- State -------------------- */

  const [mode, setMode] = useState("segments");
  const [selected, setSelected] = useState(["M SUV"]);
  const [edits, setEdits] = useState({});
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(null); // chart selection

  function switchMode(nextMode) {
    const first = MODES[nextMode].keys[0];
    setMode(nextMode);
    setSelected([first]);
    setEdits({});
    setSelectedMonthIdx(null);
  }

  const defs = MODES[mode];

  /* -------------------- Dummy monthly data (chart + per-field) -------------------- */

  // EXTEND end to 2040-01
  const monthTicks = useMemo(() => makeMonthRange("2023-01", "2040-01"), []);

  // Define the last historical month (inclusive); future begins after this index
  const HIST_START_YM = "2023-01";
  const futureCutoffYM = "2025-08";
  const futureCutoffIdx = useMemo(
    () => monthTicks.indexOf(futureCutoffYM),
    [monthTicks]
  );

  const segmentProfiles = useMemo(() => {
    const profileByKey = {};
    for (const key of MODES.segments.keys) {
      const base = MODES.segments.baselines[key];
      profileByKey[key] = buildDummyProfileForKey(key, base, monthTicks.length);
    }
    return { monthTicks, profileByKey };
  }, [monthTicks]);

  // Date range (defaults to current actual history: Jan 2023 → Aug 2025)
  const [rangeStartIdx, setRangeStartIdx] = useState(() => {
    const i = segmentProfiles.monthTicks.indexOf(HIST_START_YM);
    return i >= 0 ? i : 0;
  });
  const [rangeEndIdx, setRangeEndIdx] = useState(() => {
    const i = segmentProfiles.monthTicks.indexOf(futureCutoffYM);
    return i >= 0 ? i : segmentProfiles.monthTicks.length - 1;
  });

  /* -------------------- Derived rows -------------------- */

  const rows = useMemo(() => {
    if (mode !== "segments") {
      // Powertrains (unchanged)
      return selected.map((key) => {
        const b = defs.baselines[key];
        const s = { ...b, ...(edits[key] || {}) };
        const vol = computeVolume(s, b, COEFFS);
        return { key, label: key, ...s, volume: vol };
      });
    }

    const [rs, re] = getRangeBounds();

    return selected.map((key) => {
      const b = defs.baselines[key];

      if (selectedMonthIdx != null) {
        // Month selected: keep snapshot behavior
        const s = { ...b, ...(edits[key] || {}) };
        const vol = computeVolume(s, b, COEFFS);
        return { key, label: key, ...s, volume: vol };
      }

      // No month selected: show range averages/totals
      const stats = rangeStatsForKey(key, rs, re);
      const s = {
        ...b,
        ...(edits[key] || {}),
        price: stats.avgPrice,
        fleet: stats.avgFleet,
        lease: stats.avgLease,
        days: stats.avgDays,
        incentives: stats.avgIncentives,
      };
      return { key, label: key, ...s, volume: stats.totalVolume };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    selected,
    edits,
    selectedMonthIdx,
    rangeStartIdx,
    rangeEndIdx,
    segmentProfiles,
  ]);

  /* -------------------- KPIs (range-aware in Segments mode) -------------------- */

  const kpis = useMemo(() => {
    if (mode === "segments") {
      const rs = Math.max(
        0,
        Math.min(rangeStartIdx ?? 0, segmentProfiles.monthTicks.length - 1)
      );
      const re = Math.max(
        rs,
        Math.min(
          rangeEndIdx ?? segmentProfiles.monthTicks.length - 1,
          segmentProfiles.monthTicks.length - 1
        )
      );
      const keys = selected.filter((k) => /SUV|Pickup/i.test(k));

      let sumVol = 0;
      let sumPriceVol = 0;
      let sumFleetVol = 0;
      let sumLeaseVol = 0;
      let sumDaysVol = 0;
      let sumIncVol = 0;

      for (const key of keys) {
        const prof = segmentProfiles.profileByKey[key];
        if (!prof) continue;

        for (let i = rs; i <= re; i++) {
          const v = prof.volume[i]?.v ?? 0;
          const p = prof.price[i] ?? 0;
          const fleet = prof.fleet[i] ?? 0;
          const lease = prof.lease[i] ?? 0;
          const days = prof.days[i] ?? 0;
          const inc = prof.incentives[i] ?? 0;

          sumVol += v;
          sumPriceVol += p * v;
          sumFleetVol += fleet * v;
          sumLeaseVol += lease * v;
          sumDaysVol += days * v;
          sumIncVol += inc * v;
        }
      }

      const volWeighted = (sum) => (sumVol > 0 ? sum / sumVol : 0);

      return {
        totalVolume: sumVol,
        weightedATP: volWeighted(sumPriceVol),
        fleetMix: volWeighted(sumFleetVol),
        leaseMix: volWeighted(sumLeaseVol),
        daysSupply: volWeighted(sumDaysVol),
        incentives: volWeighted(sumIncVol),
      };
    }

    // Powertrains mode (snapshot-style)
    const totalVolume = rows.reduce((a, r) => a + r.volume, 0);
    const weightedATP =
      totalVolume > 0
        ? rows.reduce((a, r) => a + r.price * r.volume, 0) / totalVolume
        : 0;
    const fleetMix =
      totalVolume > 0
        ? rows.reduce((a, r) => a + r.fleet * r.volume, 0) / totalVolume
        : 0;
    const leaseMix =
      totalVolume > 0
        ? rows.reduce((a, r) => a + r.lease * r.volume, 0) / totalVolume
        : 0;
    const daysSupply =
      totalVolume > 0
        ? rows.reduce((a, r) => a + r.days * r.volume, 0) / totalVolume
        : 0;
    const incentives =
      totalVolume > 0
        ? rows.reduce((a, r) => a + r.incentives * r.volume, 0) / totalVolume
        : 0;

    return {
      totalVolume,
      weightedATP,
      fleetMix,
      leaseMix,
      daysSupply,
      incentives,
    };
  }, [mode, selected, rows, rangeStartIdx, rangeEndIdx, segmentProfiles]);

  /* -------------------- Apply selected month to inputs -------------------- */

  function applyMonthToInputs(idx) {
    if (mode !== "segments") return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const key of selected) {
        const prof = segmentProfiles.profileByKey[key];
        if (!prof) continue;
        const i = Math.max(
          0,
          Math.min(idx, segmentProfiles.monthTicks.length - 1)
        );
        const mNum = ymToMonthNumber(segmentProfiles.monthTicks[i]); // 1..12
        next[key] = {
          ...(next[key] || {}),
          price: Math.round(prof.price[i]),
          fleet: Math.round(prof.fleet[i]),
          lease: Math.round(prof.lease[i]),
          days: Math.round(prof.days[i]),
          incentives: Math.round(prof.incentives[i]),
          month: mNum,
        };
      }
      return next;
    });
    setSelectedMonthIdx(idx);
  }

  /* -------------------- Handlers -------------------- */

  function toggleSelection(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleChange(key, field, raw) {
    const value = toNumberSafe(raw);
    setEdits((prev) => {
      const next = { ...(prev[key] || {}) };
      if (field === "month") next.month = clamp(Math.round(value), 1, 12);
      else if (field === "price") next.price = clamp(value, 1000, 250000);
      else if (field === "fleet") next.fleet = clamp(value, 0, 100000);
      else if (field === "lease") next.lease = clamp(value, 0, 100000);
      else if (field === "days") next.days = clamp(value, 0, 400);
      else if (field === "incentives") next.incentives = clamp(value, 0, 25000);
      return { ...prev, [key]: next };
    });
  }

  function resetCard(key) {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /* -------------------- Styles -------------------- */

  const card = {
    background: COLORS.panel,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 16,
    boxSizing: "border-box",
  };

  const topWrap = {
    ...card,
    background: "transparent",
    border: "none",
    padding: 18,
    display: "grid",
    gap: 10,
  };

  const label = { color: COLORS.muted, fontSize: 12 };
  const inputRow = {
    display: "grid",
    gridTemplateColumns: "1fr 110px",
    gap: 8,
    alignItems: "center",
  };
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

  const kpiGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(160px, 1fr))",
    gap: 12,
  };
  const kpiCard = {
    background: "transparent",
    border: "none",
    borderRadius: 12,
    padding: 12,
    textAlign: "center", // center text
    display: "flex", // allow vertical alignment
    flexDirection: "column",
    alignItems: "center", // center horizontally
    justifyContent: "center", // center vertically
  };

  // Color helper
  const hexToRgb = (hex) => {
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

  // Powertrains chip (simple)
  const chip = (active) => {
    const accent = suvAccent;
    return {
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? accent : COLORS.border}`,
      background: active ? `rgba(${hexToRgb(accent)}, 0.18)` : "transparent",
      color: COLORS.text,
      cursor: "pointer",
      fontSize: 13,
      transition: "border-color 120ms ease, background-color 120ms ease",
    };
  };

  // Segment chips (fixed width, compact)
  const chipFixed = (active, label) => {
    const isPickup = /Pickup/i.test(label);
    const accent = isPickup ? PICKUP_BLUE : suvAccent;
    return {
      padding: "4px 8px",
      borderRadius: 999,
      border: `1px solid ${active ? accent : COLORS.border}`,
      background: active ? `rgba(${hexToRgb(accent)}, 0.18)` : "transparent",
      color: COLORS.text,
      cursor: "pointer",
      fontSize: 12,
      transition: "border-color 120ms ease, background-color 120ms ease",
      minWidth: 90,
      textAlign: "center",
    };
  };

  // ---- Segments chip layout (SUV row above Pickup row) ----
  const sizesOrder = ["S", "M", "L", "XL"]; // XS removed

  function renderSegmentChips() {
    const suvLabels = sizesOrder.map((s) => `${s} SUV`);
    const pickupLabels = sizesOrder.map((s) => `${s} Pickup`);

    return (
      <div style={{ display: "grid", gap: 8 }}>
        {/* SUVs row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, max-content)",
            gap: 8,
            justifyContent: "start",
          }}
        >
          {suvLabels.map((label) => {
            const active = selected.includes(label);
            return (
              <button
                key={label}
                onClick={() => toggleSelection(label)}
                style={chipFixed(active, label)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Pickups row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, max-content)",
            gap: 8,
            justifyContent: "start",
          }}
        >
          {pickupLabels.map((label) => {
            const active = selected.includes(label);
            return (
              <button
                key={label}
                onClick={() => toggleSelection(label)}
                style={chipFixed(active, label)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* -------------------- Render -------------------- */

  const selectedMonthLabel =
    selectedMonthIdx == null
      ? null
      : ymToLabel(segmentProfiles.monthTicks[selectedMonthIdx]);

  // determine whether to show dashed future (range extends past the cutoff)
  const showFutureAsDashed = rangeEndIdx > futureCutoffIdx;

  return (
    <div>
      {/* Header */}
      <div style={topWrap}>
        <h1 style={{ ...styles.h1, margin: 0, color: "#FF5432" }}>
          Market Simulation
        </h1>
        <p style={{ color: COLORS.muted, margin: 0 }}>
          Toggle <strong>Segments</strong> or <strong>Powertrains</strong>. Pick
          any items to model. Edit inputs on each card — <em>Volume</em> updates
          instantly. Click the chart to set a month and auto-fill inputs.
        </p>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {[
            { id: "segments", label: "Segments" },
            { id: "powertrains", label: "Powertrains" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: `1px solid ${
                  mode === m.id ? suvAccent : COLORS.border
                }`,
                background:
                  mode === m.id
                    ? `rgba(${hexToRgb(suvAccent)}, 0.18)`
                    : "transparent",
                color: COLORS.text,
                cursor: "pointer",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Chips */}
        <div style={{ marginTop: 6 }}>
          <div style={{ color: COLORS.muted, marginBottom: 6 }}>
            {MODES[mode].label}: choose one or more
          </div>

          {mode === "segments" ? (
            renderSegmentChips()
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {defs.keys.map((k) => {
                const active = selected.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleSelection(k)}
                    style={chip(active)}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Controls above KPIs (Segments only) */}
      {mode === "segments" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: COLORS.muted, fontSize: 12 }}>Date range:</span>

          <select
            value={rangeStartIdx}
            onChange={(e) => {
              const s = Number(e.target.value);
              const eIdx = Math.max(s, rangeEndIdx);
              setRangeStartIdx(s);
              setRangeEndIdx(eIdx);
              if (
                selectedMonthIdx != null &&
                (selectedMonthIdx < s || selectedMonthIdx > eIdx)
              ) {
                setSelectedMonthIdx(null);
              }
            }}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.text,
              fontSize: 12,
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            {segmentProfiles.monthTicks.map((m, i) => (
              <option key={`s-${m}`} value={i} style={optionStyle}>
                {m}
              </option>
            ))}
          </select>

          <span style={{ color: COLORS.muted, fontSize: 12 }}>to</span>

          <select
            value={rangeEndIdx}
            onChange={(e) => {
              const eIdx = Number(e.target.value);
              const s = Math.min(rangeStartIdx, eIdx);
              setRangeStartIdx(s);
              setRangeEndIdx(eIdx);
              if (
                selectedMonthIdx != null &&
                (selectedMonthIdx < s || selectedMonthIdx > eIdx)
              ) {
                setSelectedMonthIdx(null);
              }
            }}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.text,
              fontSize: 12,
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          >
            {segmentProfiles.monthTicks.map((m, i) => (
              <option key={`e-${m}`} value={i} style={optionStyle}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const startIdx =
                segmentProfiles.monthTicks.indexOf(HIST_START_YM);
              const endIdx = segmentProfiles.monthTicks.indexOf(futureCutoffYM);
              const s = Math.max(0, startIdx);
              const e = Math.max(s, endIdx);
              setRangeStartIdx(s);
              setRangeEndIdx(e);
              if (
                selectedMonthIdx != null &&
                (selectedMonthIdx < s || selectedMonthIdx > e)
              ) {
                setSelectedMonthIdx(null);
              }
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.muted,
              cursor: "pointer",
              fontSize: 12,
              marginLeft: 8,
            }}
          >
            Reset range
          </button>

          {selectedMonthIdx != null && (
            <button
              onClick={clearSelectedMonthToRange}
              title="Clear selected month"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.muted,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {/* KPIs + Chart */}
      <div style={{ ...card, marginTop: 8 }}>
        <div style={kpiGrid}>
          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>
              Total Volume
            </div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              {fmt(kpis.totalVolume, 0)}
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>
              Weighted ATP
            </div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              ${fmt(kpis.weightedATP, 0)}
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>Fleet Mix</div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              {fmt(kpis.fleetMix, 1)}%
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>Lease Mix</div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              {fmt(kpis.leaseMix, 1)}%
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>
              Days' Supply
            </div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              {fmt(kpis.daysSupply, 0)}
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ color: COLORS.muted, fontSize: 18 }}>Incentives</div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>
              ${fmt(kpis.incentives, 0)}
            </div>
          </div>
        </div>

        {/* Segments Line Chart (selected segments only) */}
        {mode === "segments" && (
          <div style={{ marginTop: 14 }}>
            <SegmentsLineChart
              COLORS={COLORS}
              monthTicks={segmentProfiles.monthTicks}
              seriesByKey={Object.fromEntries(
                Object.entries(segmentProfiles.profileByKey).map(([k, v]) => [
                  k,
                  v.volume,
                ])
              )}
              selectedKeys={selected.filter((k) => /SUV|Pickup/.test(k))}
              suvAccent={suvAccent}
              pickupBlue={PICKUP_BLUE}
              selectedIndex={selectedMonthIdx}
              onSelectIndex={applyMonthToInputs}
              rangeStart={rangeStartIdx}
              rangeEnd={rangeEndIdx}
              futureCutoffIdx={futureCutoffIdx}
              showFutureAsDashed={showFutureAsDashed}
            />
          </div>
        )}
      </div>

      {/* Cards per selection */}
      <div style={{ ...card, marginTop: 12 }}>
        <div
          style={{
            color: COLORS.muted,
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span>Adjust inputs to simulate volume</span>
          {selectedMonthLabel && (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: COLORS.muted }}>
                Selected month:{" "}
                <strong style={{ color: COLORS.text }}>
                  {selectedMonthLabel}
                </strong>
              </span>
            </span>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {rows.map((r) => {
            const base = defs.baselines[r.key];
            return (
              <div
                key={r.key}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{r.label}</div>
                </div>

                {/* Volume (highlight) */}
                <div
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ color: COLORS.muted, fontSize: 16 }}>
                    Volume
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 24 }}>
                    {fmt(r.volume, 0)}
                  </div>
                </div>

                {/* Inputs (populated by chart selection) */}
                <div style={inputRow}>
                  <div>
                    <div style={label}>Weighted Avg Transaction Price</div>
                  </div>
                  <input
                    type="number"
                    value={fmt(r.price, 0)}
                    onChange={(e) =>
                      handleChange(r.key, "price", e.target.value)
                    }
                    style={number}
                  />
                </div>

                <div style={{ ...inputRow, marginTop: 10 }}>
                  <div>
                    <div style={label}>Fleet Mix (%)</div>
                  </div>
                  <input
                    type="number"
                    value={fmt(r.fleet, 0)}
                    onChange={(e) =>
                      handleChange(r.key, "fleet", e.target.value)
                    }
                    style={number}
                  />
                </div>

                <div style={{ ...inputRow, marginTop: 10 }}>
                  <div>
                    <div style={label}>Lease Mix (%)</div>
                  </div>
                  <input
                    type="number"
                    value={fmt(r.lease, 0)}
                    onChange={(e) =>
                      handleChange(r.key, "lease", e.target.value)
                    }
                    style={number}
                  />
                </div>

                <div style={{ ...inputRow, marginTop: 10 }}>
                  <div>
                    <div style={label}>Days Supply</div>
                  </div>
                  <input
                    type="number"
                    value={fmt(r.days, 0)}
                    onChange={(e) =>
                      handleChange(r.key, "days", e.target.value)
                    }
                    style={number}
                  />
                </div>

                <div style={{ ...inputRow, marginTop: 10 }}>
                  <div>
                    <div style={label}>Incentives ($)</div>
                  </div>
                  <input
                    type="number"
                    value={fmt(r.incentives, 0)}
                    onChange={(e) =>
                      handleChange(r.key, "incentives", e.target.value)
                    }
                    style={number}
                  />
                </div>
              </div>
            );
          })}
        </div>
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

/* -------------------- Segments Line Chart (hover tooltips + click select + range + future-dashed) -------------------- */

function SegmentsLineChart(props) {
  const {
    COLORS,
    monthTicks,
    seriesByKey, // { key: [{i, v}, ...] }
    selectedKeys,
    suvAccent,
    pickupBlue,
    selectedIndex, // persistent selection index
    onSelectIndex, // callback(idx)
    rangeStart, // start index (inclusive)
    rangeEnd, // end index (inclusive)
    futureCutoffIdx, // index of last historical month (e.g., 2025-08)
    showFutureAsDashed, // boolean flag to render future (cutoff+1..re) dashed
  } = props;

  const svgRef = React.useRef(null);
  const [hoverI, setHoverI] = React.useState(null);
  const [hoverXsvg, setHoverXsvg] = React.useState(null);
  const [hoverLeftCss, setHoverLeftCss] = React.useState(null);

  const w = 1080;
  const h = 300;
  const padL = 40,
    padR = 24,
    padT = 18,
    padB = 36;

  // Range-aware indices
  const rs = Math.max(0, Math.min(rangeStart ?? 0, monthTicks.length - 1));
  const re = Math.max(
    rs,
    Math.min(rangeEnd ?? monthTicks.length - 1, monthTicks.length - 1)
  );
  const xMax = re - rs;

  const lines = selectedKeys
    .filter((k) => seriesByKey[k])
    .map((k) => ({ key: k, values: seriesByKey[k] }));

  const globalMax = Math.max(
    1,
    ...Object.values(seriesByKey)
      .flat()
      .map((d) => d.v)
  );

  const mapX = (i) => padL + ((i - rs) / Math.max(1, xMax)) * (w - padL - padR);
  const mapY = (v) => h - padB - (v / globalMax) * (h - padT - padB);

  // ~5 ticks across the range
  const tickCount = 5;
  const tickIdxs = Array.from({ length: tickCount }, (_, i) =>
    Math.round(rs + (i / (tickCount - 1)) * xMax)
  );

  const legendItems = lines.map((ln) => ({
    key: ln.key,
    color: colorForSegment(ln.key, suvAccent, pickupBlue),
  }));

  // Convert client CSS pixels to SVG coords
  function clientToSvg(evt) {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  function handleMove(e) {
    const p = clientToSvg(e);
    if (!p) return;

    const xSvg = Math.max(padL, Math.min(w - padR, p.x));
    const t = (xSvg - padL) / (w - padL - padR);
    const i = Math.round(rs + t * xMax);

    const rect = svgRef.current.getBoundingClientRect();
    const leftCss = (xSvg / w) * rect.width;

    setHoverI(i >= rs && i <= re ? i : null);
    setHoverXsvg(i >= rs && i <= re ? xSvg : null);
    setHoverLeftCss(leftCss);
  }

  function handleLeave() {
    setHoverI(null);
    setHoverXsvg(null);
    setHoverLeftCss(null);
  }

  function handleClick() {
    if (hoverI != null && onSelectIndex) onSelectIndex(hoverI);
  }

  const tooltipData =
    hoverI == null
      ? null
      : lines
          .map((ln) => ({
            key: ln.key,
            color: colorForSegment(ln.key, suvAccent, pickupBlue),
            v: ln.values[hoverI]?.v ?? 0,
          }))
          .sort((a, b) => b.v - a.v);

  const hoverMonthLabel = hoverI == null ? "" : ymToLabel(monthTicks[hoverI]);

  // helpers to make SVG path strings
  const toPath = (points) =>
    !points.length
      ? ""
      : points.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(" ");

  return (
    <div
      style={{
        borderTop: `1px dashed ${COLORS.border}`,
        paddingTop: 12,
        position: "relative",
      }}
    >
      <div style={{ color: COLORS.muted, marginBottom: 8 }}>
        Volume Over Time (Selected Segments)
      </div>

      {/* Legend */}
      {legendItems.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          {legendItems.map((it) => (
            <div
              key={it.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: it.color,
                }}
              />
              <span style={{ fontSize: 12, color: COLORS.muted }}>
                {it.key}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          onClick={handleClick}
          style={{ display: "block", cursor: "crosshair" }}
        >
          {/* Future projection background */}
          {showFutureAsDashed && futureCutoffIdx < re && (
            <rect
              x={mapX(Math.max(rs, futureCutoffIdx + 1))}
              y={padT}
              width={Math.max(
                1,
                mapX(re) - mapX(Math.max(rs, futureCutoffIdx + 1))
              )}
              height={h - padT - padB}
              fill={
                COLORS.panel === "#fff"
                  ? "rgba(0,0,0,0.04)"
                  : "rgba(255,255,255,0.05)"
              }
              /* Light gray in light mode, light haze in dark mode */
            />
          )}

          {/* Axes */}
          <line
            x1={padL}
            y1={h - padB}
            x2={w - padR}
            y2={h - padB}
            stroke={COLORS.border}
          />
          <line
            x1={padL}
            y1={padT}
            x2={padL}
            y2={h - padB}
            stroke={COLORS.border}
          />

          {/* X ticks & labels (range-aware) */}
          {tickIdxs.map((ti, idx) => (
            <g key={`t-${idx}`}>
              <line
                x1={mapX(ti)}
                y1={h - padB}
                x2={mapX(ti)}
                y2={h - padB + 4}
                stroke={COLORS.border}
              />
              <text
                x={mapX(ti)}
                y={h - padB + 16}
                fontSize="10"
                textAnchor="middle"
                fill={COLORS.muted}
              >
                {monthTicks[ti]}
              </text>
            </g>
          ))}

          {/* Lines (split into past solid + future dashed if applicable) */}
          {lines.map((ln) => {
            const stroke = colorForSegment(ln.key, suvAccent, pickupBlue);

            // Past segment: rs .. min(re, futureCutoffIdx)
            const pastEnd = Math.min(re, futureCutoffIdx);
            const pastPts = [];
            for (let i = rs; i <= pastEnd; i++) {
              const v = ln.values[i]?.v ?? 0;
              pastPts.push([mapX(i), mapY(v)]);
            }

            // Future segment: max(rs, futureCutoffIdx+1) .. re
            const futStart = Math.max(rs, futureCutoffIdx + 1);
            const futPts = [];
            for (let i = futStart; i <= re; i++) {
              const v = ln.values[i]?.v ?? 0;
              futPts.push([mapX(i), mapY(v)]);
            }

            // --- BRIDGE: prepend the Aug-2025 point to the dotted path so we draw the Aug→Sep segment dotted ---
            let futPtsWithBridge = futPts;
            if (showFutureAsDashed && futPts.length > 0 && pastPts.length > 0) {
              const vPastEnd = ln.values[pastEnd]?.v ?? 0;
              const augPoint = [mapX(pastEnd), mapY(vPastEnd)];
              futPtsWithBridge = [augPoint, ...futPts];
            }

            return (
              <g key={ln.key}>
                {/* Solid past path */}
                {pastPts.length > 1 && (
                  <path
                    d={toPath(pastPts)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Dotted future path (with bridge) */}
                {showFutureAsDashed && futPtsWithBridge.length > 1 && (
                  <path
                    d={toPath(futPtsWithBridge)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeDasharray="2 6"
                    strokeLinecap="round"
                  />
                )}

                {/* If future not dashed, draw normally */}
                {!showFutureAsDashed && futPts.length > 1 && (
                  <path
                    d={toPath(futPts)}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {/* Persistent selected vertical line (if within range) */}
          {selectedIndex != null &&
            selectedIndex >= rs &&
            selectedIndex <= re && (
              <line
                x1={mapX(selectedIndex)}
                x2={mapX(selectedIndex)}
                y1={padT}
                y2={h - padB}
                stroke={COLORS.text}
                opacity="0.4"
                strokeWidth="2"
              />
            )}

          {/* Hover guide + markers */}
          {hoverI != null && hoverXsvg != null && (
            <g>
              <line
                x1={hoverXsvg}
                x2={hoverXsvg}
                y1={padT}
                y2={h - padB}
                stroke={COLORS.border}
                strokeDasharray="4 4"
              />
              {lines.map((ln) => {
                const v = ln.values[hoverI]?.v ?? 0;
                return (
                  <circle
                    key={`pt-${ln.key}`}
                    cx={hoverXsvg}
                    cy={mapY(v)}
                    r="3.5"
                    fill={colorForSegment(ln.key, suvAccent, pickupBlue)}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoverI != null &&
          hoverLeftCss != null &&
          tooltipData &&
          tooltipData.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: clampPx(hoverLeftCss + 12, 8, "calc(100% - 220px)"),
                top: padT + 6,
                background: COLORS.panel,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
                pointerEvents: "none",
                minWidth: 180,
                transform: "translateZ(0)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {hoverMonthLabel}
              </div>
              {tooltipData.map((row) => (
                <div
                  key={`tt-${row.key}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginTop: 2,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: row.color,
                      }}
                    />
                    <span style={{ color: COLORS.muted }}>{row.key}</span>
                  </div>
                  <div style={{ fontVariantNumeric: "tabular-nums" }}>
                    {fmt(row.v, 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

/* -------------------- Dummy profile builder (per-field monthly values) -------------------- */

function buildDummyProfileForKey(key, base, n) {
  const rnd = mulberry32(hashString(key));
  const season = (i, amp = 0.1) => 1 + amp * Math.sin((2 * Math.PI * i) / 12);
  const noise = (amp = 0.03) => 1 + (rnd() - 0.5) * (2 * amp); // ±amp
  const trend = (i, slope = 0.0015) => 1 + slope * i;

  const price = Array.from(
    { length: n },
    (_, i) => base.price * season(i, 0.06) * trend(i, 0.0008) * noise(0.015)
  );
  const fleet = Array.from(
    { length: n },
    (_, i) => base.fleet * season(i, 0.04) * noise(0.02)
  );
  const lease = Array.from(
    { length: n },
    (_, i) => base.lease * season(i, 0.03) * noise(0.02)
  );
  const days = Array.from(
    { length: n },
    (_, i) => base.days * (2 - season(i, 0.08)) * noise(0.03) // loosely counter-seasonal
  );
  const incentives = Array.from(
    { length: n },
    (_, i) => base.incentives * season(i, 0.12) * noise(0.05)
  );
  const volume = Array.from(
    { length: n },
    (_, i) => base.base_volume * season(i, 0.1) * trend(i, 0.002) * noise(0.04)
  ).map((v) => ({ v: Math.max(1, v) }));

  return { price, fleet, lease, days, incentives, volume };
}

/* -------------------- Shared helpers -------------------- */

function ymToLabel(ym) {
  const [y, m] = ym.split("-").map((x) => parseInt(x, 10));
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
function ymToMonthNumber(ym) {
  return parseInt(ym.split("-")[1], 10); // 1..12
}

function makeMonthRange(startYM, endYM) {
  const [sY, sM] = startYM.split("-").map((n) => parseInt(n, 10));
  const [eY, eM] = endYM.split("-").map((n) => parseInt(n, 10));
  const out = [];
  let y = sY,
    m = sM;
  while (y < eY || (y === eY && m <= eM)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

function colorForSegment(label, suvAccent, pickupBlue) {
  const isPickup = /Pickup/i.test(label);
  const base = isPickup ? pickupBlue : suvAccent;
  const t = (hashString(label) % 40) - 20; // -20..+19
  return shiftHexLightness(base, t / 200); // subtle ±10% L
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}
function shiftHexLightness(hex, amt = 0) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  let r = parseInt(full.slice(0, 2), 16);
  let g = parseInt(full.slice(2, 4), 16);
  let b = parseInt(full.slice(4, 6), 16);
  const { h: H, s: S, l: L } = rgbToHsl(r, g, b);
  const L2 = clamp(L + amt, 0, 1);
  const { r: R, g: G, b: B } = hslToRgb(H, S, L2);
  const to2 = (x) => x.toString(16).padStart(2, "0");
  return `#${to2(R)}${to2(G)}${to2(B)}`;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 1);
        break;
      case g:
        h = (b - r) / d + 3;
        break;
      default:
        h = (r - g) / d + 5;
    }
    h /= 6;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return { r, g, b };
}

/* -------------------- Model -------------------- */

function computeVolume(s, base, K) {
  const priceFactor = Math.pow(s.price / base.price, K.E_PRICE);
  const fleetFactor = Math.exp(
    K.B_FLEET_PER10PP * ((s.fleet - base.fleet) / 10)
  );
  const leaseFactor = Math.exp(
    K.B_LEASE_PER10PP * ((s.lease - base.lease) / 10)
  );
  const daysFactor = Math.exp(K.B_DAYS_PER10 * ((s.days - base.days) / 10));
  const incFactor = Math.exp(
    K.B_INCENTIVES_PER_K * ((s.incentives - base.incentives) / 1000)
  );
  const vol =
    base.base_volume *
    priceFactor *
    fleetFactor *
    leaseFactor *
    daysFactor *
    incFactor;
  return Math.max(0, vol);
}

/* -------------------- Utils -------------------- */

function toNumberSafe(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
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
// clamp a pixel value within container bounds, supports 'calc(100% - Xpx)'
function clampPx(px, minPx, max) {
  if (typeof max === "number") return `${Math.max(minPx, Math.min(px, max))}px`;
  const n = parseInt(String(max).match(/- (\d+)px/)?.[1] || "240", 10);
  return `min(max(${px}px, ${minPx}px), calc(100% - ${n}px))`;
}
