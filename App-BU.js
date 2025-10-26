import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

/* STYLES */
const styles = {
  page: (dark) => ({
    minHeight: "100vh",
    padding: 24,
    fontFamily:
      "'Barlow', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    background: dark ? "#0f172a" : "#f6f8fb",
    color: dark ? "#e5e7eb" : "#0b1220",
  }),
  card: (dark) => ({
    background: dark ? "#111827" : "#fff",
    border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 14,
    boxShadow: dark ? "none" : "0 10px 24px rgba(0,0,0,0.06)",
    padding: 16,
  }),
  cardGrid: {
    maxWidth: 980,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  sublabel: (dark) => ({ margin: 0, color: dark ? "#9ca3af" : "#6b7280" }),
  button: (dark) => ({
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    background: dark ? "#1f2937" : "#fff",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 600,
  }),
  buttonPrimary: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  buttonDanger: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: (dark) => ({
    textAlign: "center",
    fontWeight: 700,
    fontSize: 12,
    padding: "10px 8px",
    borderBottom: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
    background: dark ? "#0b1220" : "#f9fafb",
    color: dark ? "#e5e7eb" : "#0b1220",
  }),
  td: (dark) => ({
    padding: "10px 8px",
    borderBottom: `1px solid ${dark ? "#1f2937" : "#f1f5f9"}`,
    verticalAlign: "middle",
    fontSize: 13,
  }),
  input: (dark) => ({
    width: "100%",
    padding: "10px 12px",
    margin: "4px 0",
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    borderRadius: 10,
    outline: "none",
    fontSize: 12,
    background: dark ? "#0b1220" : "#fff",
    color: dark ? "#e5e7eb" : "#0b1220",
    boxSizing: "border-box",
  }),
  numericInput: (dark) => ({
    width: "100%",
    padding: "10px 12px",
    margin: "4px 0",
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    borderRadius: 10,
    outline: "none",
    fontSize: 12,
    textAlign: "right",
    background: dark ? "#0b1220" : "#fff",
    color: dark ? "#e5e7eb" : "#0b1220",
    boxSizing: "border-box",
  }),
  textarea: (dark) => ({
    width: "100%",
    minHeight: 140,
    padding: "12px 14px",
    margin: "6px 0",
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    borderRadius: 12,
    outline: "none",
    fontSize: 15,
    lineHeight: 1.4,
    background: dark ? "#0b1220" : "#fff",
    color: dark ? "#e5e7eb" : "#0b1220",
    boxSizing: "border-box",
    resize: "vertical",
    whiteSpace: "pre-wrap",
  }),
  rowActions: { display: "flex", gap: 8, justifyContent: "flex-end" },
  themePill: (dark) => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: dark ? "#fde68a" : "#d1fae5",
    color: "#0b1220",
  }),
  select: (dark) => ({
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    background: dark ? "#0b1220" : "#fff",
    color: dark ? "#e5e7eb" : "#0b1220",
    fontSize: 14,
  }),
  inputSm: (dark) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: `1px solid ${dark ? "#4b5563" : "#d1d5db"}`,
    background: dark ? "#0b1220" : "#fff",
    color: dark ? "#e5e7eb" : "#0b1220",
    fontSize: 14,
    minWidth: 220,
  }),
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modalCard: (dark) => ({
    width: 420,
    maxWidth: "90vw",
    background: dark ? "#111827" : "#fff",
    border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 14,
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
    padding: 16,
  }),
};

/* HELPER FUNCTIONS */
function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
}
function toISODate(d) {
  if (d instanceof Date && !isNaN(d)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const dt = new Date(d);
  if (!isNaN(dt)) return toISODate(dt);
  return "";
}
function excelValueToISO(val) {
  if (typeof val === "number") {
    const o = XLSX.SSF.parse_date_code(val);
    if (o)
      return `${o.y}-${String(o.m).padStart(2, "0")}-${String(o.d).padStart(
        2,
        "0"
      )}`;
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return toISODate(s);
  }
  return "";
}
const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#ef4444",
  "#a855f7",
  "#f59e0b",
  "#0ea5e9",
  "#10b981",
  "#e11d48",
  "#f97316",
  "#22c55e",
];

function compactCurrency(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPct(n) {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}${abs.toFixed(1)}%`;
}

function calcRiskByLikelihood(r) {
  const impact = Number(r.totalImpact) || 0;
  const lik = Number(r.likelihood) || 0;
  return impact * (lik / 100);
}

function getQuarterKey(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1; // 0-2 → Q1, 3-5 → Q2, etc.
  return `${y}-Q${q}`;
}

/* ---------- Data shape for risks ---------- */
function makeEmptyRisk() {
  return {
    id: uid(),
    riskName: "",
    totalImpact: 0,
    likelihood: 0,
    responsible: "",
    impactYears: "",
    calculationBasis: "",
    updates: "",
    dateAdded: new Date().toISOString().slice(0, 10),
  };
}
function normalizeRiskRow(raw) {
  const lower = Object.fromEntries(
    Object.keys(raw).map((k) => [k.toLowerCase(), k])
  );
  const get = (name) => raw[lower[name.toLowerCase()]];
  return {
    id: uid(),
    riskName: String(get("Risk Name") ?? "").trim(),
    totalImpact: Number(get("Total Impact")) || 0,
    likelihood: Number(get("Likelihood")) || 0,
    responsible: String(get("Responsible") ?? "").trim(),
    impactYears: String(get("Impact Years") ?? "").trim(),
    calculationBasis: String(get("Calculation Basis") ?? "").trim(),
    updates: String(get("Updates") ?? "").trim(),
    dateAdded:
      excelValueToISO(get("Date Added")) ||
      new Date().toISOString().slice(0, 10),
  };
}

/* SNAPSHOT UTILS */
const SNAP_KEY = "risk_snapshots_v1";
function loadSnapshots() {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveSnapshots(snaps) {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(snaps));
  } catch {}
}

const ARCHIVE_KEY = "risk_archive_v1";

function loadArchive() {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveArchive(items) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
  } catch {}
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Loading risk.xlsx…");
  const [rows, setRows] = useState(() => [
    {
      id: uid(),
      riskName: "Supply delay",
      totalImpact: 250000,
      likelihood: 20,
      riskByLikelihood: 50000,
      responsible: "Ops",
      impactYears: "2025–2026",
      calculationBasis: "Avg 5-week delay × burn",
      updates: "Mitigation vendor in review",
      dateAdded: "2025-01-15",
    },
    {
      id: uid(),
      riskName: "Security incident",
      totalImpact: 400000,
      likelihood: 10,
      riskByLikelihood: 40000,
      responsible: "Security",
      impactYears: "2025",
      calculationBasis: "Historical incidents × recovery",
      updates: "Pen test scheduled",
      dateAdded: "2025-02-10",
    },
  ]);

  const [selectedIdx, setSelectedIdx] = useState(null);
  const clickedRisk = useMemo(
    () => (selectedIdx != null ? rows[selectedIdx] : null),
    [selectedIdx, rows]
  );

  const [detailsId, setDetailsId] = useState(null);
  const selectedRow = useMemo(
    () => rows.find((r) => r.id === detailsId) || null,
    [rows, detailsId]
  );

  const [snapshots, setSnapshots] = useState(loadSnapshots);
  const [archive, setArchive] = useState(loadArchive);
  const [selectedSnapId, setSelectedSnapId] = useState("");
  const [isSnapDialogOpen, setIsSnapDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const defaultSnapName = useMemo(() => {
    const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    return `Snapshot ${stamp}`;
  }, []);
  const [snapName, setSnapName] = useState(defaultSnapName);
  const [renameName, setRenameName] = useState("");

  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = process.env.PUBLIC_URL
          ? `${process.env.PUBLIC_URL}/risk.xlsx`
          : "/risk.xlsx";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error("No sheets in workbook");
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const normalized = json
          .map(normalizeRiskRow)
          .filter(
            (r) => r.riskName || r.responsible || r.totalImpact || r.likelihood
          );
        if (!cancelled && normalized.length) {
          setRows(normalized);
          setLoadMsg("");
        } else if (!cancelled) {
          setLoadMsg("risk.xlsx loaded but contained no recognizable rows.");
        }
      } catch (e) {
        if (!cancelled)
          setLoadMsg("Could not load risk.xlsx — using demo rows.");
      } finally {
        if (!cancelled) setInitialLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveSnapshots(snapshots);
  }, [snapshots]);

  useEffect(() => {
    saveArchive(archive);
  }, [archive]);

  /* TABLE HANLDERS */
  const addRow = () => setRows((r) => [makeEmptyRisk(), ...r]);

  const duplicateRow = (id) =>
    setRows((r) => {
      const idx = r.findIndex((x) => x.id === id);
      if (idx === -1) return r;
      const copy = { ...r[idx], id: uid() };
      const next = [...r];
      next.splice(idx + 1, 0, copy);
      return next;
    });

  const removeRow = (id) =>
    setRows((r) => {
      const idx = r.findIndex((x) => x.id === id);
      if (idx === -1) return r;

      const removed = {
        ...r[idx],
        __archived: true,
        archivedAt: new Date().toISOString(),
      };
      setArchive((a) => [removed, ...a]);

      const next = [...r.slice(0, idx), ...r.slice(idx + 1)];
      if (detailsId && detailsId === id) setDetailsId(null);
      return next;
    });

  const updateCell = (id, field, raw) =>
    setRows((r) =>
      r.map((row) => {
        if (row.id !== id) return row;
        if (["totalImpact", "likelihood"].includes(field)) {
          const v = Number(raw);
          return { ...row, [field]: Number.isFinite(v) ? v : 0 };
        }
        if (field === "dateAdded") {
          return { ...row, dateAdded: excelValueToISO(raw) || row.dateAdded };
        }
        return { ...row, [field]: raw };
      })
    );

  const exportToXlsx = () => {
    const data = rows.map((r) => ({
      "Risk Name": r.riskName,
      "Total Impact": Number(r.totalImpact) || 0,
      Likelihood: Number(r.likelihood) || 0,
      "Risk by Likelihood": Math.round(calcRiskByLikelihood(r)),
      Responsible: r.responsible,
      "Impact Years": r.impactYears,
      "Calculation Basis": r.calculationBasis,
      Updates: r.updates,
      "Date Added": r.dateAdded,
    }));
    const ws = XLSX.utils.json_to_sheet(data, {
      header: [
        "Risk Name",
        "Total Impact",
        "Likelihood",
        "Risk by Likelihood",
        "Responsible",
        "Impact Years",
        "Calculation Basis",
        "Updates",
        "Date Added",
      ],
    });
    ws["!cols"] = [
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 28 },
      { wch: 12 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
    for (let R = range.s.r + 1; R <= range.e.r; R++) {
      const cImpact = XLSX.utils.encode_cell({ r: R, c: 1 });
      if (ws[cImpact]) {
        ws[cImpact].t = "n";
        ws[cImpact].z = "$#,##0";
      }
      const cLik = XLSX.utils.encode_cell({ r: R, c: 2 });
      if (ws[cLik]) {
        ws[cLik].t = "n";
        ws[cLik].z = "0.0";
      }
      const cRBL = XLSX.utils.encode_cell({ r: R, c: 3 });
      if (ws[cRBL]) {
        ws[cRBL].t = "n";
        ws[cRBL].z = "#,##0";
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Risks");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `risks_export_${stamp}.xlsx`);
  };

  /* SNAPSHOTS: create / update / restore / rename / delete */
  const openSnapDialog = () => {
    setSnapName(
      `Snapshot ${new Date().toISOString().replace("T", " ").slice(0, 16)}`
    );
    setIsSnapDialogOpen(true);
  };

  const confirmSnapshot = () => {
    const id = uid();
    const stamp = new Date().toISOString();
    const snapRows = rows.map((r) => ({ ...r }));
    const snap = {
      id,
      name: (snapName || "").trim() || `Snapshot ${stamp}`,
      createdAt: stamp,
      rows: snapRows,
    };
    setSnapshots((s) => [snap, ...s]);
    setSelectedSnapId(id);
    setIsSnapDialogOpen(false);
  };

  const cancelSnapshot = () => setIsSnapDialogOpen(false);

  const onSelectSnapshot = (id) => {
    setSelectedSnapId(id);
    const snap = snapshots.find((s) => s.id === id);
    if (snap) {
      setRows(snap.rows.map((r) => ({ ...r })));
      setDetailsId(null);
    }
  };

  const updateSnapshot = () => {
    if (!selectedSnapId) return;
    const stamp = new Date().toISOString();
    setSnapshots((snaps) =>
      snaps.map((s) =>
        s.id === selectedSnapId
          ? { ...s, rows: rows.map((r) => ({ ...r })), updatedAt: stamp }
          : s
      )
    );
  };

  const openRenameDialog = () => {
    if (!selectedSnapId) return;
    const snap = snapshots.find((s) => s.id === selectedSnapId);
    setRenameName(snap?.name || "");
    setIsRenameDialogOpen(true);
  };
  const confirmRenameSnapshot = () => {
    if (!selectedSnapId) return;
    const newName = (renameName || "").trim();
    if (!newName) {
      setIsRenameDialogOpen(false);
      return;
    }
    const stamp = new Date().toISOString();
    setSnapshots((snaps) =>
      snaps.map((s) =>
        s.id === selectedSnapId ? { ...s, name: newName, renamedAt: stamp } : s
      )
    );
    setIsRenameDialogOpen(false);
  };
  const cancelRename = () => setIsRenameDialogOpen(false);

  const openDeleteDialog = () => {
    if (!selectedSnapId) return;
    setIsDeleteDialogOpen(true);
  };
  const confirmDeleteDialog = () => {
    if (!selectedSnapId) return;
    setSnapshots((snaps) => snaps.filter((s) => s.id !== selectedSnapId));
    setSelectedSnapId("");
    setIsDeleteDialogOpen(false);
  };
  const cancelDeleteDialog = () => setIsDeleteDialogOpen(false);

  /* KPIs */
  const entries = rows.length;
  const totalImpactSum = rows.reduce(
    (s, r) => s + (Number(r.totalImpact) || 0),
    0
  );
  const totalRiskByLikelihood = rows.reduce(
    (s, r) => s + calcRiskByLikelihood(r),
    0
  );

  /* LINE CHART - DATA */
  const { labels, datasets } = useMemo(() => {
    const dateSet = new Set(rows.map((r) => r.dateAdded).filter(Boolean));
    const labels = Array.from(dateSet).sort();
    const names = Array.from(
      new Set(rows.map((r) => (r.riskName || "").trim()).filter(Boolean))
    ).sort();

    const datasets = names.map((name, i) => {
      const byDate = new Map();
      rows.forEach((r) => {
        if ((r.riskName || "").trim() === name)
          byDate.set(r.dateAdded, calcRiskByLikelihood(r));
      });
      return {
        label: name,
        data: labels.map((d) => (byDate.has(d) ? byDate.get(d) : null)),
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: PALETTE[i % PALETTE.length] + "33",
        tension: 0.25,
        fill: false,
        spanGaps: false,
        pointRadius: 9,
        pointHoverRadius: 12,
      };
    });

    return { labels, datasets };
  }, [rows]);

  /* RISK BY LIKELIHOOD - QUARTERLY */
  const { qLabels, qDatasets } = useMemo(() => {
    const sums = new Map();

    rows.forEach((r) => {
      const key = getQuarterKey(r.dateAdded);
      if (!key) return;
      const val = calcRiskByLikelihood(r);
      sums.set(key, (sums.get(key) || 0) + val);
    });

    const keys = Array.from(sums.keys()).sort((a, b) => {
      const [ya, qa] = a.split("-Q").map(Number);
      const [yb, qb] = b.split("-Q").map(Number);
      return ya !== yb ? ya - yb : qa - qb;
    });

    const data = keys.map((k) => Math.round(sums.get(k)));

    const color = dark ? "#EF4444" : "#F97316";

    return {
      qLabels: keys,
      qDatasets: [
        {
          label: "Total Risk by Likelihood",
          data,
          borderColor: color,
          backgroundColor: color + "33",
          tension: 0.25,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [rows, dark]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: dark ? "#e5e7eb" : "#0b1220" },
        },
        tooltip: {
          titleColor: dark ? "#e5e7eb" : "#0b1220",
          bodyColor: dark ? "#e5e7eb" : "#0b1220",
          backgroundColor: dark
            ? "rgba(17,24,39,0.9)"
            : "rgba(255,255,255,0.95)",
          borderColor: dark ? "#374151" : "#e5e7eb",
          borderWidth: 1,
          callbacks: {
            title: (ctx) => (ctx[0]?.label ? `Date: ${ctx[0].label}` : ""),
            label: (ctx) =>
              `${ctx.dataset.label}: ${Number(
                ctx.parsed.y ?? 0
              ).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: dark ? "#e5e7eb" : "#0b1220", maxRotation: 0 },
          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: true,
            text: "Date Added",
            color: dark ? "#e5e7eb" : "#0b1220",
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: dark ? "#e5e7eb" : "#0b1220" },
          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: true,
            text: "Risk by Likelihood",
            color: dark ? "#e5e7eb" : "#0b1220",
          },
        },
      },
    }),
    [dark]
  );

  const quarterChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          titleColor: dark ? "#e5e7eb" : "#0b1220",
          bodyColor: dark ? "#e5e7eb" : "#0b1220",
          backgroundColor: dark
            ? "rgba(17,24,39,0.9)"
            : "rgba(255,255,255,0.95)",
          borderColor: dark ? "#374151" : "#e5e7eb",
          borderWidth: 1,
          callbacks: {
            title: (ctx) => ctx[0]?.label || "",
            label: (ctx) => {
              const val = Number(ctx.parsed.y ?? 0);
              if (val >= 1_000_000_000)
                return `$${(val / 1_000_000_000).toFixed(1)}B`;
              if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
              if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
              return `$${val.toFixed(0)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: dark ? "#e5e7eb" : "#0b1220" },
          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: dark ? "#e5e7eb" : "#0b1220",
            callback: (v) => {
              const num = Number(v);
              if (num >= 1_000_000_000)
                return `$${(num / 1_000_000_000).toFixed(1)}B`;
              if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(0)}M`;
              if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
              return `$${num.toFixed(0)}`;
            },
          },

          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: false,
          },
        },
      },
    }),
    [dark]
  );

  const yMid = useMemo(() => {
    const impacts = rows.map((r) => Number(r.totalImpact) || 0);
    const yMax = Math.max(0, ...impacts);
    return (0 + yMax) / 2; // beginAtZero is true → yMin = 0
  }, [rows]);

  const pctChangeByRowId = useMemo(() => {
    const byNameAll = new Map();
    const push = (rec, isCurrent) => {
      const name = (rec.riskName || "").trim();
      if (!name) return;
      const d = new Date(rec.dateAdded);
      if (isNaN(d)) return;
      if (!byNameAll.has(name)) byNameAll.set(name, []);
      byNameAll.get(name).push({ ...rec, __isCurrent: !!isCurrent });
    };

    rows.forEach((r) => push(r, true));
    archive.forEach((r) => push(r, false));

    const out = new Map();

    byNameAll.forEach((list) => {
      list.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
      if (!list.length) return;

      let latestCurrent = null;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].__isCurrent) {
          latestCurrent = list[i];
          break;
        }
      }
      if (!latestCurrent) return;

      const latestIdx = list.findIndex((x) => x.id === latestCurrent.id);
      if (latestIdx <= 0) return; // no previous record

      const prev = list[latestIdx - 1];
      const latestImpact = Number(latestCurrent.totalImpact) || 0;
      const prevImpact = Number(prev.totalImpact) || 0;

      if (prevImpact === 0) {
        out.set(latestCurrent.id, null); // undefined %
      } else {
        const pct = ((latestImpact - prevImpact) / prevImpact) * 100;
        out.set(latestCurrent.id, pct);
      }
    });

    return out;
  }, [rows, archive]);

  const quadrantCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    rows.forEach((r) => {
      const x = Number(r.likelihood) || 0;
      const y = Number(r.totalImpact) || 0;
      const left = x < 50;
      const top = y >= yMid;

      if (left && top) counts.medium += 1; // Top-left (Yellow)
      else if (left && !top) counts.low += 1; // Bottom-left (Green)
      else if (!left && top) counts.critical += 1; // Top-right (Red)
      else counts.high += 1; // Bottom-right (Orange)
    });
    return counts;
  }, [rows, yMid]);

  /* SCATTERPLOT */
  const scatterData = useMemo(() => {
    const colorFor = (x, y) => {
      const left = x < 50;
      const top = y >= yMid;
      if (left && top) return "#FFD700"; // Yellow (Top-Left)
      if (left && !top) return "#22C55E"; // Green  (Bottom-Left)
      if (!left && top) return "#EF4444"; // Red    (Top-Right)
      return "#F97316"; // Orange (Bottom-Right)
    };

    const points = rows.map((r, i) => {
      const x = Number(r.likelihood) || 0;
      const y = Number(r.totalImpact) || 0;
      return {
        x,
        y,
        name: r.riskName || `Risk ${i + 1}`,
        color: colorFor(x, y),
      };
    });

    return {
      datasets: [
        {
          label: "Risks",
          data: points.map((p) => ({ x: p.x, y: p.y })),
          pointBackgroundColor: points.map((p) => p.color),
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 9,
          pointHoverRadius: 12,
          showLine: false,
        },
      ],
    };
  }, [rows, yMid]);

  const scatterOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      onClick: (evt, elements) => {
        if (elements && elements.length) {
          const { index } = elements[0];
          setSelectedIdx(index);
        } else {
          setSelectedIdx(null);
        }
      },

      onHover: (evt, elements) => {
        const target = evt?.native?.target || evt?.target;
        if (target)
          target.style.cursor =
            elements && elements.length ? "pointer" : "default";
      },

      interaction: { mode: "nearest", intersect: true },

      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          borderColor: dark ? "#374151" : "#e5e7eb",
          borderWidth: 1,

          callbacks: {
            title: () => "",
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const r = rows[idx];
              return r?.riskName || `Risk ${idx + 1}`;
            },
          },

          backgroundColor: (ctx) => {
            const dp = ctx.tooltip?.dataPoints?.[0];
            if (!dp) return dark ? "#111827" : "#ffffff";

            const color =
              dp.element?.options?.backgroundColor ||
              dp.element?.options?.pointBackgroundColor ||
              (dark ? "#111827" : "#ffffff");

            return `${color}CC`;
          },

          bodyColor: "#000",
        },
      },

      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 100,
          ticks: {
            color: dark ? "#e5e7eb" : "#0b1220",
            font: { size: 10 },
            callback: (v) => `${v}%`,
          },
          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: true,
            text: "Likelihood",
            color: dark ? "#e5e7eb" : "#0b1220",
          },
        },

        y: {
          beginAtZero: true,
          ticks: {
            color: dark ? "#e5e7eb" : "#0b1220",
            font: { size: 10 },
            callback: (v) => {
              const bill = v / 1_000_000_000;
              return `$${bill}B`;
            },
          },
          grid: {
            color: dark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.25)",
          },
          title: {
            display: true,
            text: "Total Impact",
            color: dark ? "#e5e7eb" : "#0b1220",
          },
        },
      },
    }),
    [dark, rows]
  );

  /* SCATTERPLOT - DOTTED LINES */
  const scatterCrossPlugin = useMemo(
    () => ({
      id: "scatterCross",
      afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;

        const xScale = scales?.x;
        const yScale = scales?.y;
        if (!xScale || !yScale) return;

        const x = xScale.getPixelForValue(50);
        const xPx = Number.isFinite(x)
          ? x
          : (chartArea.left + chartArea.right) / 2;

        const yDataMid =
          Number.isFinite(yScale.min) && Number.isFinite(yScale.max)
            ? (yScale.min + yScale.max) / 2
            : undefined;

        const y =
          yDataMid !== undefined
            ? yScale.getPixelForValue(yDataMid)
            : undefined;
        const yPx = Number.isFinite(y)
          ? y
          : (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = dark ? 3 : 2;
        ctx.strokeStyle = dark ? "#FFFFFF" : "rgba(17,24,39,0.6)";

        // Vertical
        ctx.beginPath();
        ctx.moveTo(xPx, chartArea.top);
        ctx.lineTo(xPx, chartArea.bottom);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(chartArea.left, yPx);
        ctx.lineTo(chartArea.right, yPx);
        ctx.stroke();

        ctx.restore();
      },
    }),
    [dark]
  );

  /* ---------- Quadrant background shading plugin (robust first paint) ---------- */
  const scatterQuadrantPlugin = useMemo(
    () => ({
      id: "scatterQuadrants",
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;

        const xScale = scales?.x;
        const yScale = scales?.y;
        if (!xScale || !yScale) return;

        // X midpoint (50% likelihood)
        const xMid = xScale.getPixelForValue(50);
        const xMidPx = Number.isFinite(xMid)
          ? xMid
          : (chartArea.left + chartArea.right) / 2;

        // Y midpoint: prefer scale domain midpoint; fallback to pixel midpoint
        const yDataMid =
          Number.isFinite(yScale.min) && Number.isFinite(yScale.max)
            ? (yScale.min + yScale.max) / 2
            : undefined;

        const yMid =
          yDataMid !== undefined
            ? yScale.getPixelForValue(yDataMid)
            : undefined;

        const yMidPx = Number.isFinite(yMid)
          ? yMid
          : (chartArea.top + chartArea.bottom) / 2;

        ctx.save();

        // Colors (20% opacity)
        const yellow = "rgba(255, 215, 0, 0.20)"; // Top-left
        const green = "rgba(34, 197, 94, 0.20)"; // Bottom-left
        const red = "rgba(239, 68, 68, 0.20)"; // Top-right
        const orange = "rgba(249, 115, 22, 0.20)"; // Bottom-right

        // TL
        ctx.fillStyle = yellow;
        ctx.fillRect(
          chartArea.left,
          chartArea.top,
          xMidPx - chartArea.left,
          yMidPx - chartArea.top
        );
        // BL
        ctx.fillStyle = green;
        ctx.fillRect(
          chartArea.left,
          yMidPx,
          xMidPx - chartArea.left,
          chartArea.bottom - yMidPx
        );
        // TR
        ctx.fillStyle = red;
        ctx.fillRect(
          xMidPx,
          chartArea.top,
          chartArea.right - xMidPx,
          yMidPx - chartArea.top
        );
        // BR
        ctx.fillStyle = orange;
        ctx.fillRect(
          xMidPx,
          yMidPx,
          chartArea.right - xMidPx,
          chartArea.bottom - yMidPx
        );

        ctx.restore();
      },
    }),
    []
  );

  /* ---------- Dynamic CSS for date icon color ---------- */
  const datePickerFilter = dark ? "invert(1) brightness(2)" : "invert(0)";
  const dateInputStyle = `
    /* Date picker icon tinting */
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: ${datePickerFilter};
    }

    /* Remove number input arrows */
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type=number] {
      -moz-appearance: textfield; /* Firefox */
    }
  `;

  return (
    <>
      <style>{dateInputStyle}</style>
      <div style={styles.page(dark)}>
        {/* Top bar */}
        <div style={{ maxWidth: 980, margin: "0 auto 12px" }}>
          <div
            style={{
              ...styles.card(dark),
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src="/Scout-Script-HarvestOrange.png"
                alt="App Logo"
                style={{ height: 22, width: "auto", borderRadius: 8 }}
              />
            </div>

            <h1 style={{ margin: 0, fontSize: 22, textAlign: "center" }}>
              Project Risk Management Radar
            </h1>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={styles.themePill(dark)}>
                {dark ? "Dark" : "Light"} Mode
              </span>
              <button
                style={styles.button(dark)}
                onClick={() => setDark((v) => !v)}
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={styles.cardGrid}>
          {/* Total Risks */}
          <div
            style={{
              ...styles.card(dark),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                ...styles.sublabel(dark),
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Total Risks
            </h3>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "2.2rem",
                  textAlign: "center",
                }}
              >
                {entries}
              </h1>
            </div>
          </div>

          {/* Total Exposure */}
          <div
            style={{
              ...styles.card(dark),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                ...styles.sublabel(dark),
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Total Exposure
            </h3>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "2.2rem",
                  textAlign: "center",
                }}
              >
                {compactCurrency(totalRiskByLikelihood)}
              </h1>
            </div>
          </div>

          {/* Weighted Risk Score */}
          <div
            style={{
              ...styles.card(dark),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                ...styles.sublabel(dark),
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Weighted Risk Score
            </h3>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "2.2rem",
                  textAlign: "center",
                }}
              >
                {entries
                  ? compactCurrency(totalRiskByLikelihood / entries)
                  : "$0"}
              </h1>
            </div>
          </div>

          {/* Risk Distribution */}
          <div
            style={{
              ...styles.card(dark),
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                ...styles.sublabel(dark),
                textAlign: "center",
                fontSize: "1.1rem",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Risk Distribution
            </h3>

            <div style={{ display: "grid", gap: 8 }}>
              {/* LOW — No concern */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 14,
                  padding: "0 40px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: "#22C55E" }}>LOW</span>
                </span>
                <strong>{quadrantCounts.low}</strong>
              </div>

              {/* MEDIUM — Some concern */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 14,
                  padding: "0 40px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: "#FFD700" }}>
                    MEDIUM
                  </span>
                </span>
                <strong>{quadrantCounts.medium}</strong>
              </div>

              {/* HIGH — Definitely concerned */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 14,
                  padding: "0 40px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: "#F97316" }}>
                    HIGH
                  </span>
                </span>
                <strong>{quadrantCounts.high}</strong>
              </div>

              {/* CRITICAL — Highly concerned */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 14,
                  padding: "0 40px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, color: "#EF4444" }}>
                    CRITICAL
                  </span>
                </span>
                <strong>{quadrantCounts.critical}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ ...styles.card(dark) }}>
            <div style={{ ...styles.headerRow }}>
              <h2 style={{ margin: 0, fontSize: 24, paddingLeft: 20 }}>
                Risks
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {/* Snapshots dropdown */}
                <select
                  style={{
                    ...styles.select(dark),
                    fontSize: 10,
                    minWidth: 120,
                  }}
                  value={selectedSnapId}
                  onChange={(e) => onSelectSnapshot(e.target.value)}
                  title="Select a saved snapshot to restore"
                >
                  <option value="">Snapshots…</option>
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Create / Update / Rename / Delete */}
                <button
                  style={{
                    ...styles.button(dark),
                    fontSize: 10,
                  }}
                  onClick={openSnapDialog}
                >
                  Create Snapshot
                </button>

                <button
                  style={{ ...styles.button(dark), fontSize: 10 }}
                  onClick={updateSnapshot}
                  disabled={!selectedSnapId}
                  title={
                    selectedSnapId
                      ? "Overwrite the selected snapshot with the current table"
                      : "Select a snapshot first"
                  }
                >
                  Update Snapshot
                </button>
                <button
                  style={{ ...styles.button(dark), fontSize: 10 }}
                  onClick={openRenameDialog}
                  disabled={!selectedSnapId}
                  title={
                    selectedSnapId
                      ? "Rename selected snapshot"
                      : "Select one first"
                  }
                >
                  Rename
                </button>
                <button
                  style={{
                    ...styles.button(dark),
                    fontSize: 10,
                    borderColor: "#ef4444",
                    color: "#ef4444",
                  }}
                  onClick={openDeleteDialog}
                  disabled={!selectedSnapId}
                  title={
                    selectedSnapId
                      ? "Delete selected snapshot"
                      : "Select one first"
                  }
                >
                  Delete
                </button>

                {/* Export / Add Row */}
                <button
                  style={{ ...styles.button(dark), fontSize: 10 }}
                  onClick={exportToXlsx}
                >
                  Export
                </button>
                <button
                  style={{ ...styles.buttonPrimary, fontSize: 10 }}
                  onClick={addRow}
                >
                  + Add Row
                </button>
              </div>
            </div>

            {/* Create Snapshot dialog */}
            {isSnapDialogOpen && (
              <div
                style={{
                  ...styles.card(dark),
                  borderStyle: "dashed",
                  marginBottom: 8,
                  background: dark ? "#0b1220" : "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ ...styles.sublabel(dark), fontWeight: 600 }}>
                    Name this snapshot:
                  </span>
                  <input
                    style={styles.inputSm(dark)}
                    value={snapName}
                    onChange={(e) => setSnapName(e.target.value)}
                    placeholder="e.g., End of Q1 – mitigations applied"
                  />
                  <button
                    style={styles.buttonPrimary}
                    onClick={confirmSnapshot}
                  >
                    Confirm
                  </button>
                  <button style={styles.button(dark)} onClick={cancelSnapshot}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Rename Snapshot dialog */}
            {isRenameDialogOpen && (
              <div
                style={{
                  ...styles.card(dark),
                  borderStyle: "dashed",
                  marginBottom: 8,
                  background: dark ? "#0b1220" : "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ ...styles.sublabel(dark), fontWeight: 600 }}>
                    Rename snapshot:
                  </span>
                  <input
                    style={styles.inputSm(dark)}
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    placeholder="New snapshot name"
                  />
                  <button
                    style={styles.buttonPrimary}
                    onClick={confirmRenameSnapshot}
                  >
                    Confirm
                  </button>
                  <button style={styles.button(dark)} onClick={cancelRename}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Custom delete modal */}
            {isDeleteDialogOpen && (
              <div style={styles.modalOverlay}>
                <div style={styles.modalCard(dark)}>
                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>Warning!</h3>
                  <p style={{ marginTop: 0, opacity: 0.85 }}>
                    This will permanently delete the selected snapshot. This
                    cannot be undone.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      marginTop: 12,
                    }}
                  >
                    <button
                      style={styles.button(dark)}
                      onClick={cancelDeleteDialog}
                    >
                      Cancel
                    </button>
                    <button
                      style={styles.buttonDanger}
                      onClick={confirmDeleteDialog}
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!!loadMsg && !initialLoaded && (
              <p style={{ opacity: 0.7, marginTop: 0 }}>{loadMsg}</p>
            )}
            {!!loadMsg && initialLoaded && (
              <p style={{ opacity: 0.7, marginTop: 0 }}>{loadMsg}</p>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <colgroup>
                  <col style={{ width: 90 }} /> {/* %Δ (latest vs previous) */}
                  <col style={{ width: "40%" }} /> {/* Risk Name */}
                  <col style={{ width: 120 }} /> {/* Total Impact */}
                  <col style={{ width: 90 }} /> {/* Likelihood */}
                  <col style={{ width: 140 }} /> {/* Risk by Likelihood */}
                  <col style={{ width: 110 }} /> {/* Impact Years */}
                  <col style={{ width: 90 }} /> {/* Details */}
                  <col style={{ width: 120 }} /> {/* Actions */}
                </colgroup>

                <thead>
                  <tr>
                    <th
                      style={{ ...styles.th(dark), textAlign: "center" }}
                    ></th>
                    <th style={styles.th(dark)}>Risk Name</th>
                    <th style={{ ...styles.th(dark), textAlign: "center" }}>
                      Total Impact
                    </th>
                    <th style={{ ...styles.th(dark), textAlign: "center" }}>
                      Likelihood (%)
                    </th>
                    <th style={{ ...styles.th(dark), textAlign: "center" }}>
                      Risk by Likelihood
                    </th>
                    <th style={styles.th(dark)}>Impact Years</th>
                    <th
                      style={{ ...styles.th(dark), textAlign: "center" }}
                    ></th>
                    <th
                      style={{ ...styles.th(dark), textAlign: "center" }}
                    ></th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr>
                        {/* NEW: %Δ (latest vs previous Total Impact, only on most recent row per Risk Name) */}
                        <td
                          style={{
                            ...styles.td(dark),
                            textAlign: "center",
                            fontWeight: 700,
                          }}
                        >
                          {(() => {
                            const pct = pctChangeByRowId.get(row.id);
                            if (pct === undefined) return ""; // not the latest row or no history
                            if (pct === null) return ""; // previous impact == 0 → undefined %
                            const up = pct > 0;
                            const down = pct < 0;
                            const color = up
                              ? "#EF4444"
                              : down
                              ? "#16A34A"
                              : dark
                              ? "#9ca3af"
                              : "#6b7280";
                            const arrow = up ? "▲" : down ? "▼" : "•";
                            return (
                              <span style={{ color }}>
                                {arrow} {formatPct(pct)}
                              </span>
                            );
                          })()}
                        </td>

                        {/* 2) Risk Name */}
                        <td style={styles.td(dark)}>
                          <input
                            type="text"
                            value={row.riskName}
                            onChange={(e) =>
                              updateCell(row.id, "riskName", e.target.value)
                            }
                            style={{
                              ...styles.input(dark),
                              fontWeight: 700,
                              fontSize: "10px",
                            }}
                          />
                        </td>

                        {/* 3) Total Impact ($) */}
                        <td style={styles.td(dark)}>
                          <input
                            type="number"
                            value={row.totalImpact}
                            onChange={(e) =>
                              updateCell(row.id, "totalImpact", e.target.value)
                            }
                            style={{ ...styles.numericInput(dark), width: 100 }}
                            step="1"
                            min="0"
                          />
                        </td>

                        {/* 4) Likelihood (%) */}
                        <td
                          style={{
                            ...styles.td(dark),
                            maxWidth: "70px",
                            textAlign: "center",
                            paddingRight: "8px",
                          }}
                        >
                          <input
                            type="number"
                            value={row.likelihood}
                            onChange={(e) =>
                              updateCell(row.id, "likelihood", e.target.value)
                            }
                            style={{
                              ...styles.input(dark),
                              width: 50,
                              textAlign: "center",
                              MozAppearance: "textfield",
                              appearance: "textfield",
                            }}
                            step="0.1"
                            min="0"
                          />
                        </td>

                        {/* 5) Risk by Likelihood (computed, read-only, currency) */}
                        <td style={{ ...styles.td(dark), textAlign: "right" }}>
                          {(() => {
                            const val = calcRiskByLikelihood(row);
                            return Number.isFinite(val)
                              ? val.toLocaleString(undefined, {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                })
                              : "$0";
                          })()}
                        </td>

                        {/* 7) Impact Years */}
                        <td style={styles.td(dark)}>
                          <input
                            type="text"
                            value={row.impactYears}
                            onChange={(e) =>
                              updateCell(row.id, "impactYears", e.target.value)
                            }
                            placeholder="e.g., 2025–2027"
                            style={{
                              ...styles.input(dark),
                              width: 90,
                              textAlign: "center",
                            }}
                          />
                        </td>

                        {/* 8) Details column */}
                        <td style={{ ...styles.td(dark), textAlign: "right" }}>
                          <button
                            style={styles.button(dark)}
                            title="Show details below"
                            onClick={() =>
                              setDetailsId(detailsId === row.id ? null : row.id)
                            }
                          >
                            {detailsId === row.id ? "Hide" : "Details"}
                          </button>
                        </td>

                        {/* 9) Actions */}
                        <td style={styles.td(dark)}>
                          <div style={styles.rowActions}>
                            <button
                              style={styles.button(dark)}
                              title="Duplicate row"
                              onClick={() => duplicateRow(row.id)}
                            >
                              +
                            </button>
                            <button
                              style={{
                                ...styles.button(dark),
                                borderColor: "#ef4444",
                                color: "#ef4444",
                                fontSize: "14px",
                                lineHeight: "1",
                              }}
                              title="Remove row"
                              onClick={() => removeRow(row.id)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Details panel row (only when expanded) */}
                      {detailsId === row.id && (
                        <tr>
                          <td style={styles.td(dark)} colSpan={8}>
                            <div
                              style={{
                                ...styles.card(dark),
                                background: dark ? "#0b1220" : "#f9fafb",
                                borderStyle: "dashed",
                              }}
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: 12,
                                }}
                              >
                                {/* Date Added */}
                                <div>
                                  <label
                                    style={{
                                      ...styles.sublabel(dark),
                                      fontWeight: 600,
                                    }}
                                  >
                                    Date Added
                                  </label>
                                  <input
                                    type="date"
                                    value={row.dateAdded}
                                    onChange={(e) =>
                                      updateCell(
                                        row.id,
                                        "dateAdded",
                                        e.target.value
                                      )
                                    }
                                    style={styles.input(dark)}
                                  />
                                </div>

                                <div>
                                  <label
                                    style={{
                                      ...styles.sublabel(dark),
                                      fontWeight: 600,
                                    }}
                                  >
                                    Responsible
                                  </label>
                                  <input
                                    type="text"
                                    value={row.responsible}
                                    onChange={(e) =>
                                      updateCell(
                                        row.id,
                                        "responsible",
                                        e.target.value
                                      )
                                    }
                                    style={styles.input(dark)}
                                  />
                                </div>

                                <div>
                                  <label
                                    style={{
                                      ...styles.sublabel(dark),
                                      fontWeight: 600,
                                    }}
                                  >
                                    Calculation Basis
                                  </label>
                                  <textarea
                                    style={styles.textarea(dark)}
                                    value={row.calculationBasis}
                                    onChange={(e) =>
                                      updateCell(
                                        row.id,
                                        "calculationBasis",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Explain how this risk's impact was calculated…"
                                  />
                                </div>

                                <div>
                                  <label
                                    style={{
                                      ...styles.sublabel(dark),
                                      fontWeight: 600,
                                    }}
                                  >
                                    Updates / Notes
                                  </label>
                                  <textarea
                                    style={styles.textarea(dark)}
                                    value={row.updates}
                                    onChange={(e) =>
                                      updateCell(
                                        row.id,
                                        "updates",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Status changes, mitigations, owners, blockers…"
                                  />
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 8,
                                }}
                              >
                                <button
                                  style={styles.button(dark)}
                                  onClick={() => setDetailsId(null)}
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {rows.length === 0 && initialLoaded && (
                    <tr>
                      <td style={styles.td(dark)} colSpan={8}>
                        <em>
                          No rows. Click “Add Row” or check columns in
                          risk.xlsx.
                        </em>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scatterplot (left) + Details card (right) as two separate boxes */}
        <div
          style={{
            maxWidth: 980,
            margin: "16px auto",
            display: "grid",
            gridTemplateColumns: "minmax(0, 65%) minmax(0, 35%)",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* LEFT CARD: Scatterplot */}
          <div style={styles.card(dark)}>
            {/* Title */}
            <h2 style={{ marginTop: 0, textAlign: "center" }}>Risk Matrix</h2>

            {/* Chart */}
            <div style={{ height: 400 }}>
              <Line
                key={`scatter-${dark ? "dark" : "light"}-${rows.length}`}
                data={scatterData}
                options={scatterOptions}
                plugins={[scatterQuadrantPlugin, scatterCrossPlugin]}
              />
            </div>
          </div>

          {/* RIGHT CARD: Dynamic Details */}
          <div
            style={{
              ...styles.card(dark),
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 20 }}>
                Risk Details
              </h3>
              {clickedRisk && (
                <button
                  style={styles.button(dark)}
                  onClick={() => setSelectedIdx(null)}
                >
                  Clear
                </button>
              )}
            </div>

            {!clickedRisk ? (
              <p style={{ margin: 0, opacity: 0.7 }}>
                Click a point in the chart to see full details here.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Risk Name
                  </p>
                  <div style={{ fontWeight: 700 }}>
                    {clickedRisk.riskName || "—"}
                  </div>
                </div>

                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Likelihood
                  </p>
                  <div>{Number(clickedRisk.likelihood || 0).toFixed(1)}%</div>
                </div>
                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Total Impact
                  </p>
                  <div>
                    {Number(clickedRisk.totalImpact || 0).toLocaleString(
                      undefined,
                      {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }
                    )}
                  </div>
                </div>

                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Risk by Likelihood
                  </p>
                  <div>
                    {calcRiskByLikelihood(clickedRisk).toLocaleString(
                      undefined,
                      {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }
                    )}
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Responsible
                  </p>
                  <div>{clickedRisk.responsible || "—"}</div>
                </div>

                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Impact Years
                  </p>
                  <div>{clickedRisk.impactYears || "—"}</div>
                </div>
                <div>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Date Added
                  </p>
                  <div>{clickedRisk.dateAdded || "—"}</div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Calculation Basis
                  </p>
                  <div
                    style={{
                      padding: "8px 10px",
                      border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: dark ? "#0b1220" : "#fff",
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                    }}
                  >
                    {clickedRisk.calculationBasis || "—"}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    style={{
                      ...styles.sublabel(dark),
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Updates / Notes
                  </p>
                  <div
                    style={{
                      padding: "8px 10px",
                      border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
                      borderRadius: 8,
                      background: dark ? "#0b1220" : "#fff",
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                    }}
                  >
                    {clickedRisk.updates || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line chart */}
        <div style={{ maxWidth: 980, margin: "16px auto" }}>
          <div style={{ ...styles.card(dark) }}>
            <h2 style={{ marginTop: 0, textAlign: "center" }}>
              Risk Exposure by Quarter
            </h2>
            <div style={{ height: 360 }}>
              <Line
                data={{ labels: qLabels, datasets: qDatasets }}
                options={quarterChartOptions}
              />
            </div>
          </div>
        </div>
      </div>{" "}
      {/* ⬅️ THIS closes the outer <div style={styles.page(dark)}> */}
    </>
  );
}
