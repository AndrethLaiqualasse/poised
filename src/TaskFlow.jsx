import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Tray, CalendarDot, CalendarPlus, CalendarDots, CalendarBlank, SquaresFour, Calendar, CheckCircle, FolderSimple, Hash, Gear, Envelope, UserCircle, Briefcase } from "@phosphor-icons/react";
import { supabase } from "./supabase.js";

// Load Tabler icons from CDN
if (typeof document !== "undefined" && !document.getElementById("tabler-icons-css")) {
  const link = document.createElement("link");
  link.id = "tabler-icons-css";
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.19.0/tabler-icons.min.css";
  document.head.appendChild(link);
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.modify";

const TODAY = new Date().toLocaleDateString("en-CA");
const TOMORROW = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString("en-CA"); })();
const PRIORITY_LABELS = { p1: "High", p2: "Medium", p3: "Low", p4: "None" };

// ── THEME CONTEXT ────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

const THEMES = {
  Dusk: {
    bg: "#333447", bgSurface: "#3b3c52", bgRaised: "#45475f", bgHover: "#4f516d",
    border: "rgba(200,185,220,0.1)", borderMed: "rgba(200,185,220,0.2)",
    text: "#edeaf6", textMuted: "#b0a8c8", textFaint: "#6e6488",
    accent: "#be6f89", accentBg: "rgba(190,111,137,0.15)", accentMuted: "rgba(190,111,137,0.25)", accentShadow: "rgba(190,111,137,0.4)",
    danger: "#f87171", dangerBorder: "rgba(248,113,113,0.3)", success: "#34d399", warning: "#c4a55a",
    priority: { p1: { color: "#f87171" }, p2: { color: "#c490b4" }, p3: { color: "#7a6890" }, p4: { color: "#5a4d70" } },
    status: { "Not Started": { color: "#7a6890" }, Working: { color: "#c490b4" }, Waiting: { color: "#c4a55a" }, Complete: { color: "#34d399" }, Deferred: { color: "#5a4d70" } },
    clientChipBg: "rgba(196,144,180,0.15)", clientChipColor: "#d4a8c8",
    businessCtxBg: "rgba(196,144,180,0.15)", businessCtxColor: "#c490b4",
    personalCtxBg: "rgba(167,139,250,0.12)", personalCtxColor: "#c4b5fd",
    progressBar: "#c490b4",
    projBusinessBg: "rgba(196,144,180,0.15)", projBusinessColor: "#c490b4",
    projPersonalBg: "rgba(167,139,250,0.12)", projPersonalColor: "#c4b5fd",
    projClientBg: "rgba(196,144,180,0.1)", projClientColor: "#d4a8c8",
    gmailBizBg: "#2d2040", gmailPersonalBg: "#2d1f35",
    calTodayBg: "rgba(196,144,180,0.15)", calTodayColor: "#c490b4",
    calSelectedBg: "#c490b4", calSelectedColor: "white", calDot: "#c490b4",
    completedDivider: "rgba(200,185,220,0.15)",
  },
  Ocean: {
    bg: "#2e3446", bgSurface: "#363d52", bgRaised: "#3f4760", bgHover: "#48526e",
    border: "rgba(180,195,225,0.1)", borderMed: "rgba(180,195,225,0.2)",
    text: "#e8edf6", textMuted: "#a0b2cc", textFaint: "#5e7294",
    accent: "#8ba4cc", accentBg: "rgba(139,164,204,0.15)", accentMuted: "rgba(139,164,204,0.25)", accentShadow: "rgba(139,164,204,0.35)",
    danger: "#f87171", dangerBorder: "rgba(248,113,113,0.3)", success: "#34d399", warning: "#c4a55a",
    priority: { p1: { color: "#f87171" }, p2: { color: "#94afd4" }, p3: { color: "#4d6a93" }, p4: { color: "#3d5070" } },
    status: { "Not Started": { color: "#4d6a93" }, Working: { color: "#94afd4" }, Waiting: { color: "#c4a55a" }, Complete: { color: "#34d399" }, Deferred: { color: "#3d5070" } },
    clientChipBg: "rgba(56,139,253,0.15)", clientChipColor: "#79c0ff",
    businessCtxBg: "rgba(139,164,204,0.15)", businessCtxColor: "#8ba4cc",
    personalCtxBg: "rgba(167,139,250,0.12)", personalCtxColor: "#c4b5fd",
    progressBar: "#1D9E75",
    projBusinessBg: "#EEEDFE", projBusinessColor: "#534AB7",
    projPersonalBg: "#FAEEDA", projPersonalColor: "#854F0B",
    projClientBg: "#E6F1FB", projClientColor: "#185FA5",
    gmailBizBg: "#1e1b4b", gmailPersonalBg: "#3b0764",
    calTodayBg: "#EEEDFE", calTodayColor: "#534AB7",
    calSelectedBg: "#534AB7", calSelectedColor: "white", calDot: "#534AB7",
    completedDivider: "#e5e7eb",
  },
  Midnight: {
    bg: "#1a1928", bgSurface: "#212038", bgRaised: "#2a2848", bgHover: "#343258",
    border: "rgba(180,170,220,0.1)", borderMed: "rgba(180,170,220,0.2)",
    text: "#e8e4f8", textMuted: "#9e98c0", textFaint: "#5c5680",
    accent: "#a78bfa", accentBg: "rgba(167,139,250,0.15)", accentMuted: "rgba(167,139,250,0.25)", accentShadow: "rgba(167,139,250,0.4)",
    danger: "#f87171", dangerBorder: "rgba(248,113,113,0.3)", success: "#34d399", warning: "#fbbf24",
    priority: { p1: { color: "#f87171" }, p2: { color: "#a78bfa" }, p3: { color: "#6b5fa0" }, p4: { color: "#4a4070" } },
    status: { "Not Started": { color: "#6b5fa0" }, Working: { color: "#a78bfa" }, Waiting: { color: "#fbbf24" }, Complete: { color: "#34d399" }, Deferred: { color: "#4a4070" } },
    clientChipBg: "rgba(167,139,250,0.15)", clientChipColor: "#c4b5fd",
    businessCtxBg: "rgba(167,139,250,0.15)", businessCtxColor: "#a78bfa",
    personalCtxBg: "rgba(232,180,230,0.12)", personalCtxColor: "#e8b4e6",
    progressBar: "#a78bfa",
    projBusinessBg: "rgba(167,139,250,0.15)", projBusinessColor: "#a78bfa",
    projPersonalBg: "rgba(232,180,230,0.12)", projPersonalColor: "#e8b4e6",
    projClientBg: "rgba(167,139,250,0.1)", projClientColor: "#c4b5fd",
    gmailBizBg: "#1a1440", gmailPersonalBg: "#2a1438",
    calTodayBg: "rgba(167,139,250,0.15)", calTodayColor: "#a78bfa",
    calSelectedBg: "#a78bfa", calSelectedColor: "white", calDot: "#a78bfa",
    completedDivider: "rgba(180,170,220,0.15)",
  },
  Slate: {
    bg: "#252830", bgSurface: "#2d3038", bgRaised: "#363a44", bgHover: "#404450",
    border: "rgba(180,190,210,0.1)", borderMed: "rgba(180,190,210,0.2)",
    text: "#e4e8f0", textMuted: "#9aa4b8", textFaint: "#5a6478",
    accent: "#7ec8c8", accentBg: "rgba(126,200,200,0.15)", accentMuted: "rgba(126,200,200,0.25)", accentShadow: "rgba(126,200,200,0.4)",
    danger: "#f87171", dangerBorder: "rgba(248,113,113,0.3)", success: "#34d399", warning: "#fbbf24",
    priority: { p1: { color: "#f87171" }, p2: { color: "#7ec8c8" }, p3: { color: "#4d7878" }, p4: { color: "#3a5858" } },
    status: { "Not Started": { color: "#4d7878" }, Working: { color: "#7ec8c8" }, Waiting: { color: "#fbbf24" }, Complete: { color: "#34d399" }, Deferred: { color: "#3a5858" } },
    clientChipBg: "rgba(126,200,200,0.15)", clientChipColor: "#7ec8c8",
    businessCtxBg: "rgba(126,200,200,0.15)", businessCtxColor: "#7ec8c8",
    personalCtxBg: "rgba(167,139,250,0.12)", personalCtxColor: "#c4b5fd",
    progressBar: "#7ec8c8",
    projBusinessBg: "rgba(126,200,200,0.15)", projBusinessColor: "#7ec8c8",
    projPersonalBg: "rgba(167,139,250,0.12)", projPersonalColor: "#c4b5fd",
    projClientBg: "rgba(126,200,200,0.1)", projClientColor: "#7ec8c8",
    gmailBizBg: "#1a2428", gmailPersonalBg: "#1a2030",
    calTodayBg: "rgba(126,200,200,0.15)", calTodayColor: "#7ec8c8",
    calSelectedBg: "#7ec8c8", calSelectedColor: "white", calDot: "#7ec8c8",
    completedDivider: "rgba(180,190,210,0.15)",
  },
};

const EMPTY_FILTERS = { pri: "all", status: "all", date: "all", tag: [], proj: "all", client: "all" };
const EMPTY_SORT = "manual";

const Chip = ({ children, style }) => (
  <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 20, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3, ...style }}>{children}</span>
);

// ── FILTER DROPDOWN ──────────────────────────────────────────────────────
function FilterDropdown({ filters, setFilters, filterTags, statuses, extraGroups = [] }) {
  const D = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const activeCount = Object.entries(filters).filter(([k, v]) => k === "tag" ? v.length > 0 : v !== "all").length;
  const groups = [
    { key: "pri", label: "Priority", opts: [["all", "Any"], ["p1", "High"], ["p2", "Medium"], ["p3", "Low"]] },
    { key: "status", label: "Status", opts: [["all", "Any"], ...statuses.map(s => [s, s])] },
    { key: "date", label: "Date", opts: [["all", "Any"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["this-week", "This week"], ["next-week", "Next week"], ["this-month", "This month"], ["next-month", "Next month"]] },
    ...extraGroups,
    { key: "tag", label: "Tags", multi: true, opts: [["all", "Any"], ...filterTags.map(t => [t, "#" + t])] },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Filters"
        style={{ background: "none", border: "none", cursor: "pointer", color: activeCount > 0 ? D.accent : D.textMuted, padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, position: "relative" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {activeCount > 0 && <span style={{ position: "absolute", top: 2, right: 2, width: 7, height: 7, borderRadius: "50%", background: D.accent }} />}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", width: 260, background: D.bgRaised, border: `0.5px solid ${D.borderMed}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 100, maxHeight: 420, overflowY: "auto", padding: "8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px 8px", borderBottom: `0.5px solid ${D.border}`, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Filters</span>
            {activeCount > 0 && <button onClick={() => setFilters(EMPTY_FILTERS)} style={{ fontSize: 13, color: D.accent, background: "none", border: "none", cursor: "pointer" }}>Clear all</button>}
          </div>
          {groups.map(g => (
            <div key={g.key} style={{ padding: "4px 12px 8px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: D.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{g.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.opts.map(([val, label]) => {
                  const active = g.multi
                    ? (val === "all" ? filters[g.key].length === 0 : filters[g.key].includes(val))
                    : filters[g.key] === val;
                  const handleClick = g.multi
                    ? () => setFilters(f => ({ ...f, [g.key]: val === "all" ? [] : f[g.key].includes(val) ? f[g.key].filter(t => t !== val) : [...f[g.key], val] }))
                    : () => setFilters(f => ({ ...f, [g.key]: val }));
                  return (
                    <span key={val} onClick={handleClick}
                      style={{ fontSize: 13, padding: "3px 9px", borderRadius: 20, border: `0.5px solid ${active ? D.accent : D.border}`, cursor: "pointer", background: active ? D.accentBg : "transparent", color: active ? D.accent : D.textMuted, whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SORT DROPDOWN ────────────────────────────────────────────────────────
function SortDropdown({ sort, setSort }) {
  const D = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const opts = [["manual", "Manual"], ["pri", "Priority"], ["due", "Due date"], ["status", "Status"]];
  const activeLabel = opts.find(([v]) => v === sort)?.[1] || "Manual";
  const isActive = sort !== "manual";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Sort"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, color: isActive ? D.accent : D.textMuted, fontSize: 14, fontWeight: isActive ? 600 : 400 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
        </svg>
        {isActive && <span style={{ fontSize: 12 }}>{activeLabel}</span>}
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", width: 160, background: D.bgRaised, border: `0.5px solid ${D.borderMed}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 100, padding: "6px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: D.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 12px 6px" }}>Sort by</div>
          {opts.map(([val, label]) => (
            <div key={val} onClick={() => { setSort(val); setOpen(false); }}
              style={{ fontSize: 15, padding: "8px 12px", cursor: "pointer", color: sort === val ? D.accent : D.text, background: sort === val ? D.accentBg : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {label}
              {sort === val && "✓"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TaskRow({ task, clientLabel, onDone, onEdit, onDelete, onSelect, isSelected, draggable, onDragStart, onDragOver, onDrop }) {
  const D = useTheme();
  const due = task.due ? fmtDue(task.due) : null;
  const [swipeX, setSwipeX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isHoriz = useRef(null);
  const THRESHOLD = 80;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHoriz.current = null;
    setAnimating(false);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isHoriz.current === null) isHoriz.current = Math.abs(dx) > Math.abs(dy);
    if (isHoriz.current && dx < 0) setSwipeX(Math.max(dx, -110));
  };

  const handleTouchEnd = () => {
    setAnimating(true);
    if (swipeX <= -THRESHOLD) {
      setSwipeX(-110);
      setDeleting(true);
      setTimeout(() => onDelete(task.id), 320);
    } else {
      setSwipeX(0);
    }
    touchStartX.current = null;
    isHoriz.current = null;
  };

  const handleClick = () => {
    if (swipeX !== 0) { setAnimating(true); setSwipeX(0); return; }
    onEdit(task);
  };

  const revealPct = Math.min(Math.abs(swipeX) / THRESHOLD, 1);

  // Selection circle (left) — replaces the old complete button for non-done tasks
  const selCircle = task.done ? (
    // Done tasks: green filled circle, non-interactive for selection
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: D.success, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  ) : (
    <div onClick={e => { e.stopPropagation(); onSelect(task.id); }}
      style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${isSelected ? D.accent : D.borderMed}`, background: isSelected ? D.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer", transition: "all .15s" }}>
      {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </div>
  );

  return (
    <div style={{ position: "relative", overflow: "hidden", borderBottom: `0.5px solid ${D.border}` }}>
      {/* Delete background */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 110, background: D.danger, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: revealPct }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Delete</span>
      </div>
      {/* Row content */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", background: isSelected ? D.accentBg : D.bg, cursor: "pointer", opacity: deleting ? 0 : task.done ? 0.55 : 1, transform: `translateX(${swipeX}px)`, transition: animating ? "transform 0.25s ease, opacity 0.25s ease" : "none" }}
        draggable={draggable}
        onDragStart={draggable ? onDragStart : undefined}
        onDragOver={draggable ? e => e.preventDefault() : undefined}
        onDrop={draggable ? onDrop : undefined}
      >
        {selCircle}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: task.done ? D.textFaint : D.text, textDecoration: task.done ? "line-through" : "none", marginBottom: 3, lineHeight: 1.35 }}>{task.subject}</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <Chip style={{ background: "transparent", ...(D.status[task.status] || D.status["Not Started"]) }}>{task.status}</Chip>
            <Chip style={{ background: "transparent", ...(D.priority[task.priority] || D.priority.p4) }}>{PRIORITY_LABELS[task.priority]}</Chip>
            {task.ctx === "business" && clientLabel && <Chip style={{ background: D.clientChipBg, color: D.clientChipColor }}>{clientLabel}</Chip>}
            {due && <span style={{ fontSize: 12, color: due.ov ? D.danger : D.textMuted, display: "inline-flex", alignItems: "center", gap: 2 }}> {due.l}</span>}
          </div>
        </div>
        {/* Quick complete (right side) — only for non-done tasks */}
        {!task.done ? (
          <button onClick={e => { e.stopPropagation(); onDone(task.id); }}
            style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${D.borderMed}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", marginTop: -2 }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke={D.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ) : (
          <button onClick={e => { e.stopPropagation(); onDone(task.id, true); }}
            style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Undo</button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  const D = useTheme();
  return <div style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, padding: "7px 13px 3px", background: D.bgSurface, borderBottom: `0.5px solid ${D.border}`, letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</div>;
}

// ── TASK DRAWER ──────────────────────────────────────────────────────────
function TaskDrawer({ open, onClose, initialTask, onSave, onDelete, clients, projects, filterTags, statuses, forceCtx }) {
  const D = useTheme();
  const isEdit = !!initialTask;
  const defaultCtx = forceCtx || (isEdit ? initialTask.ctx : "personal");

  const [form, setForm] = useState({ subject: "", description: "", priority: "p2", status: "Not Started", due: "", client_id: "", project_id: "", recurring: "none", reminder: false, reminder_at: "" });
  const [selectedTags, setSelectedTags] = useState([]);
  const [ctx, setCtx] = useState(defaultCtx);

  useEffect(() => {
    if (open) {
      const base = initialTask || {};
      setCtx(forceCtx || base.ctx || "personal");
      setForm({
        subject: base.subject || "",
        description: base.description || "",
        priority: base.priority || "p2",
        status: base.status || "Not Started",
        due: base.due || "",
        client_id: base.client_id || "",
        project_id: base.project_id || "",
        recurring: base.recurring || "none",
        reminder: base.reminder || false,
        reminder_at: base.reminder_at || "",
      });
      setSelectedTags(base.tags || []);
    }
  }, [open, initialTask, forceCtx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = t => setSelectedTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  const handleProjChange = (projId, projectsList) => {
    set("project_id", projId);
    const proj = projectsList.find(p => p.id === projId);
    if (proj && proj.client_id) set("client_id", proj.client_id);
  };

  const handleSave = () => {
    if (!form.subject.trim()) return;
    const due = form.due || null;
    onSave({ ...form, ctx, tags: selectedTags, due, inbox: !due, client_id: ctx === "personal" ? null : form.client_id || null });
  };

  if (!open) return null;

  const inp = { width: "100%", fontSize: 15, padding: "7px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.text, boxSizing: "border-box" };
  const lbl = { fontSize: 13, fontWeight: 500, color: D.textMuted, marginBottom: 3, display: "block" };
  const row = { marginBottom: 11 };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 };
  const isPersonal = ctx === "personal";
  const availableProjects = projects.filter(p => p.ctx === ctx && !p.archived);
  // clients/projects passed as objects [{id,name,ctx,...}]

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: D.bgSurface, borderRadius: "16px 16px 0 0", maxHeight: "92%", display: "flex", flexDirection: "column", border: `0.5px solid ${D.borderMed}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: D.bgHover, margin: "9px auto 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: D.text }}>{isEdit ? "Edit task" : "New task"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMuted, display: "flex", alignItems: "center" }}>✕</button>
        </div>

        {!forceCtx && !isEdit && (
          <div style={{ display: "flex", borderBottom: `0.5px solid ${D.border}`, margin: "8px 13px 0" }}>
            {[["personal", "Personal", UserCircle], ["business", "Business", Briefcase]].map(([c, label, Icon]) => (
              <button key={c} onClick={() => setCtx(c)}
                style={{ flex: 1, padding: "8px 4px", fontSize: 15, fontWeight: 500, background: "none", border: "none", borderBottom: ctx === c ? `2px solid ${D.accent}` : "2px solid transparent", color: ctx === c ? D.accent : D.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <Icon size={18} weight="light" />{label}
              </button>
            ))}
          </div>
        )}
        {(forceCtx || isEdit) && (
          <div style={{ padding: "6px 13px 0" }}>
            <Chip style={ctx === "business"
              ? { background: D.businessCtxBg, color: D.businessCtxColor }
              : { background: D.personalCtxBg, color: D.personalCtxColor }}>
              {ctx === "business" ? "Business" : "Personal"}
            </Chip>
          </div>
        )}

        <div style={{ overflowY: "auto", padding: 13, flex: 1 }}>
          <div style={row}><label style={lbl}>Subject *</label><input style={inp} value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="What needs to be done?" /></div>
          <div style={row}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 52, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Notes…" /></div>
          <div style={grid}>
            <div style={row}><label style={lbl}>Priority</label>
              <select style={inp} value={form.priority} onChange={e => set("priority", e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={row}><label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={grid}>
            <div style={row}><label style={lbl}>Due date <span style={{ fontWeight: 400, color: D.textFaint }}>(optional)</span></label>
              <input type="date" style={inp} value={form.due} onChange={e => set("due", e.target.value)} />
            </div>
            <div style={row}><label style={lbl}>Project</label>
              <select style={inp} value={form.project_id || ""} onChange={e => handleProjChange(e.target.value, projects)}>
                <option value="">— none —</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {!isPersonal && (
            <div style={row}><label style={lbl}>Client</label>
              <select style={inp} value={form.client_id || ""} onChange={e => set("client_id", e.target.value)}>
                <option value="">— none —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div style={row}>
            <label style={lbl}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 3 }}>
              {filterTags.map(t => (
                <span key={t} onClick={() => toggleTag(t)} style={{ fontSize: 13, padding: "3px 9px", borderRadius: 20, border: `0.5px solid ${selectedTags.includes(t) ? D.accent : D.borderMed}`, cursor: "pointer", background: selectedTags.includes(t) ? D.accentBg : "transparent", color: selectedTags.includes(t) ? D.accent : D.textMuted }}>#{t}</span>
              ))}
            </div>
          </div>
          <div style={row}><label style={lbl}>Recurring</label>
            <select style={inp} value={form.recurring} onChange={e => set("recurring", e.target.value)}>
              {["none", "daily", "weekly", "monthly", "yearly"].map(r => <option key={r} value={r}>{r === "none" ? "Not recurring" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            {form.recurring !== "none" && <p style={{ fontSize: 13, color: D.textFaint, marginTop: 4 }}>Next recurrence creates only after this one is completed.</p>}
          </div>
          {initialTask?.done && initialTask?.done_at && (
            <div style={row}>
              <label style={lbl}>Completed</label>
              <div style={{ ...inp, color: D.textMuted, cursor: "default" }}>
                {new Date(initialTask.done_at + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          )}
          <div style={row}>
            <label style={lbl}>Reminder</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div onClick={() => set("reminder", !form.reminder)} style={{ width: 36, height: 20, borderRadius: 20, background: form.reminder ? D.accent : D.bgHover, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", width: 16, height: 16, borderRadius: "50%", background: "white", top: 2, left: form.reminder ? 18 : 2, transition: "left .2s" }} />
              </div>
              <span style={{ fontSize: 14, color: D.textMuted }}>{form.reminder ? "On" : "Off"}</span>
              {form.reminder && <input type="datetime-local" style={{ ...inp, flex: 1 }} value={form.reminder_at || ""} onChange={e => set("reminder_at", e.target.value)} />}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", padding: "11px 13px", borderTop: `0.5px solid ${D.border}`, flexShrink: 0 }}>
          {isEdit ? (
            <button onClick={onDelete} style={{ fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.dangerBorder}`, background: "transparent", color: D.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
               Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={onClose} style={{ fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} style={{ fontSize: 14, padding: "5px 12px", borderRadius: 8, border: "none", background: D.accent, color: "white", cursor: "pointer", fontWeight: 500 }}>Save task</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN SCREEN ─────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (!error) setSent(true);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const D = THEMES.Dusk;
  const inp = { width: "100%", fontSize: 16, padding: "10px 12px", borderRadius: 10, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.text, boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: D.bg }}>
      <div style={{ width: 340, padding: 32, background: D.bgSurface, borderRadius: 20, border: `0.5px solid ${D.borderMed}`, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", lineHeight: 1, color: D.text, marginBottom: 24, textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>P</span><span style={{ fontSize: 16, letterSpacing: "0.18em" }}>OISED</span>
        </div>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontSize: 15, color: D.text, marginBottom: 6 }}>Check your inbox</div>
            <div style={{ fontSize: 14, color: D.textMuted }}>We sent a magic link to <strong>{email}</strong></div>
          </div>
        ) : (
          <>
            {/* Google sign-in */}
            <button onClick={handleGoogle} disabled={googleLoading}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.text, fontSize: 15, fontWeight: 500, cursor: googleLoading ? "default" : "pointer", opacity: googleLoading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              {googleLoading ? "Redirecting…" : "Sign in with Google"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: "0.5px", background: D.borderMed }} />
              <span style={{ fontSize: 12, color: D.textFaint }}>or</span>
              <div style={{ flex: 1, height: "0.5px", background: D.borderMed }} />
            </div>

            {/* Magic link */}
            <label style={{ fontSize: 13, color: D.textMuted, display: "block", marginBottom: 6 }}>Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="you@example.com" style={inp}
            />
            <button onClick={handleLogin} disabled={loading}
              style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 10, border: "none", background: D.accent, color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── DATE HELPERS ─────────────────────────────────────────────────────────
function weekRange() {
  const d = new Date(TODAY + "T00:00:00"), day = d.getDay();
  const sun = new Date(d); sun.setDate(d.getDate() - day);
  const sat = new Date(sun); sat.setDate(sun.getDate() + 6);
  return { start: sun.toISOString().slice(0, 10), end: sat.toISOString().slice(0, 10) };
}
function nextWeekRange() {
  const { start } = weekRange(); const s = new Date(start + "T00:00:00"); s.setDate(s.getDate() + 7);
  const e = new Date(s); e.setDate(s.getDate() + 6);
  return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
}
function monthRange(offset = 0) {
  const d = new Date(TODAY + "T00:00:00"), y = d.getFullYear(), m = d.getMonth() + offset;
  return { start: new Date(y, m, 1).toISOString().slice(0, 10), end: new Date(y, m + 1, 0).toISOString().slice(0, 10) };
}
function inRange(due, s, e) { return due && due >= s && due <= e; }
function fmtDue(d) {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00"), today = new Date(TODAY + "T00:00:00");
  const diff = Math.round((dt - today) / 86400000);
  if (diff === 0) return { l: "Today", ov: false };
  if (diff === 1) return { l: "Tomorrow", ov: false };
  if (diff === -1) return { l: "Yesterday", ov: true };
  if (diff < 0) return { l: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }), ov: true };
  return { l: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }), ov: false };
}
function fmtDoneDate(d) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Recently";
}

// ── MAIN APP ─────────────────────────────────────────────────────────────
export default function TaskFlow() {
  const [selectedTheme, setSelectedTheme] = useState("Dusk");
  const D = THEMES[selectedTheme];

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("inbox");
  const [globalCtx, setGlobalCtx] = useState("personal");
  const [currentClient, setCurrentClient] = useState("");
  const [currentProj, setCurrentProj] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawer, setDrawer] = useState({ open: false, task: null, forceCtx: null, prefill: {} });
  const [contextFilters, setContextFilters] = useState({ business: { ...EMPTY_FILTERS }, personal: { ...EMPTY_FILTERS } });
  const [contextSort, setContextSort] = useState({ business: EMPTY_SORT, personal: EMPTY_SORT });
  const [filters, setFiltersRaw] = useState({ ...EMPTY_FILTERS });
  const [sort, setSortRaw] = useState(EMPTY_SORT);

  function setFilters(f) {
    setFiltersRaw(f);
    setContextFilters(cf => ({ ...cf, [globalCtx]: f }));
  }
  function setSort(s) {
    setSortRaw(s);
    setContextSort(cs => ({ ...cs, [globalCtx]: s }));
  }
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // null | "pri" | "status" | "due"
  const [bulkDue, setBulkDue] = useState("");
  const [toast, setToast] = useState(null); // { id, sub }
  const toastTimer = useRef(null);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const exitSelect = () => { setSelectedIds(new Set()); setBulkAction(null); setBulkDue(""); };
  const applyBulk = async (field, value) => {
    const ids = [...selectedIds];
    const updates = { [field]: value };
    if (field === "status" && value === "Complete") { updates.done = true; updates.done_at = TODAY; }
    await supabase.from("tasks").update(updates).in("id", ids);
    setTasks(ts => ts.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
    exitSelect();
  };
  const applyBulkComplete = async () => {
    const ids = [...selectedIds];
    const updates = { done: true, done_at: TODAY, status: "Complete" };
    await supabase.from("tasks").update(updates).in("id", ids);
    setTasks(ts => ts.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
    exitSelect();
  };
  const applyBulkDelete = async () => {
    const ids = [...selectedIds];
    await supabase.from("tasks").delete().in("id", ids);
    setTasks(ts => ts.filter(t => !ids.includes(t.id)));
    exitSelect();
  };

  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(4);
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [calDayTasks, setCalDayTasks] = useState([]);
  const [calDayLabel, setCalDayLabel] = useState("");
  const [calFilters, setCalFilters] = useState({ ...EMPTY_FILTERS });
  const dragSrc = useRef(null);
  const swipeTouchStartX = useRef(null);
  const swipeTouchStartY = useRef(null);

  const handleSwipeStart = (e) => {
    swipeTouchStartX.current = e.touches[0].clientX;
    swipeTouchStartY.current = e.touches[0].clientY;
  };

  const handleSwipeEnd = (e) => {
    if (swipeTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeTouchStartX.current;
    const dy = e.changedTouches[0].clientY - swipeTouchStartY.current;
    swipeTouchStartX.current = null;
    swipeTouchStartY.current = null;
    // Ignore mostly-vertical swipes
    if (Math.abs(dy) > Math.abs(dx)) return;
    // Swipe right from left edge → open
    if (dx > 60 && !menuOpen) setMenuOpen(true);
    // Swipe left → close
    if (dx < -60 && menuOpen) setMenuOpen(false);
  };

  const [clients, setClients] = useState([]); // [{id, name, ctx}]
  const [projects, setProjects] = useState([]); // [{id, name, ctx, client_id, archived}]
  const [taskTypes, setTaskTypes] = useState(["Phone Call", "Research", "Shopping", "Admin", "Other"]);
  const [filterTags, setFilterTags] = useState(["5 min task", "Online Shopping", "Waiting on", "Quick win"]);
  const [statuses, setStatuses] = useState(["Not Started", "Working", "Waiting", "Complete", "Deferred"]);
  const [gmailTokens, setGmailTokens] = useState([]);
  const [gmailEmails, setGmailEmails] = useState({});     // { tokenId: [emailObj] }
  const [dismissedEmailIds, setDismissedEmailIds] = useState(new Set());
  const [gmailLoading, setGmailLoading] = useState({});
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [emailBodies, setEmailBodies] = useState({});     // { messageId: plainText }
  const [bodyLoading, setBodyLoading] = useState({});
  const [newInputs, setNewInputs] = useState({});
  const [newProjForm, setNewProjForm] = useState({ name: "", ctx: "business", client_id: "" });
  const [newClientForm, setNewClientForm] = useState({ name: "", ctx: "business" });
  const [accordionOpen, setAccordionOpen] = useState({ views: true, clients: false, projects: false, archivedProjects: false, tags: false });
  const [currentTag, setCurrentTag] = useState("");

  // Load data from Supabase whenever user changes
  useEffect(() => {
    if (!user) { setTasks([]); setProjects([]); setClients([]); setGmailTokens([]); return; }
    const load = async () => {
      const [{ data: t }, { data: p }, { data: c }, { data: g }] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("projects").select("*").order("name", { ascending: true }),
        supabase.from("clients").select("*").order("name", { ascending: true }),
        supabase.from("gmail_tokens").select("*"),
      ]);
      if (t) setTasks(t);
      if (p) setProjects(p);
      if (c) setClients(c);
      if (g) setGmailTokens(g);
    };
    load();
  }, [user]);

  // Handle Gmail OAuth callback (detects ?code= in URL after Google redirect)
  const gmailCallbackHandled = useRef(false);
  useEffect(() => {
    if (!authReady || !user) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state && !gmailCallbackHandled.current) {
      gmailCallbackHandled.current = true;
      handleGmailCallback(code, state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user]);

  // Helpers
  const clientName = (id) => clients.find(c => c.id === id)?.name || "";
  const projectById = (id) => projects.find(p => p.id === id);

  // ── Gmail OAuth & API helpers ─────────────────────────────────────────────

  function connectGmail(ctx) {
    const redirectUri = window.location.origin;
    const state = JSON.stringify({ ctx, redirectUri });
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GMAIL_SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function handleGmailCallback(code, state) {
    let ctx = "personal";
    let redirectUri = window.location.origin;
    try { const s = JSON.parse(state); ctx = s.ctx; redirectUri = s.redirectUri; } catch (_) { /* ignore */ }

    // Exchange code for tokens via serverless function
    const resp = await fetch("/api/gmail-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exchange", code, redirect_uri: redirectUri }),
    });
    const data = await resp.json();
    if (data.error) {
      console.error("Gmail token exchange error:", data);
      alert("Gmail auth error: " + data.error + (data.error_description ? " — " + data.error_description : "") + "\n\nRedirect URI used: " + redirectUri);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Fetch the account's email address
    const profileResp = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const profile = await profileResp.json();

    const tokenPayload = {
      user_id: user.id,
      email: profile.emailAddress,
      ctx,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    };

    // Upsert — if this Gmail address is already connected, update it
    const existing = gmailTokens.find(t => t.email === profile.emailAddress);
    if (existing) {
      const { data: updated } = await supabase.from("gmail_tokens").update(tokenPayload).eq("id", existing.id).select().single();
      if (updated) setGmailTokens(ts => ts.map(t => t.id === updated.id ? updated : t));
    } else {
      const { data: inserted } = await supabase.from("gmail_tokens").insert(tokenPayload).select().single();
      if (inserted) setGmailTokens(ts => [...ts, inserted]);
    }

    // Clean the ?code= params from the URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function getValidToken(tokenRecord) {
    // Return existing token if not expiring in next 60 seconds
    if (tokenRecord.expires_at - 60 > Date.now() / 1000) return tokenRecord.access_token;

    const resp = await fetch("/api/gmail-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh", refresh_token: tokenRecord.refresh_token }),
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error_description || data.error);

    const newExpires = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
    await supabase.from("gmail_tokens").update({ access_token: data.access_token, expires_at: newExpires }).eq("id", tokenRecord.id);
    setGmailTokens(ts => ts.map(t => t.id === tokenRecord.id ? { ...t, access_token: data.access_token, expires_at: newExpires } : t));
    return data.access_token;
  }

  function stripHtml(html) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractBody(msg) {
    const findPart = (parts, mimeType) => {
      if (!parts) return null;
      for (const part of parts) {
        if (part.mimeType === mimeType && part.body?.data) return part.body.data;
        if (part.parts) { const r = findPart(part.parts, mimeType); if (r) return r; }
      }
      return null;
    };
    // Prefer plain text; fall back to HTML (stripped)
    let b64 = null;
    let isHtml = false;
    if (msg.payload?.mimeType === "text/plain" && msg.payload.body?.data) {
      b64 = msg.payload.body.data;
    } else if (msg.payload?.mimeType === "text/html" && msg.payload.body?.data) {
      b64 = msg.payload.body.data; isHtml = true;
    } else {
      b64 = findPart(msg.payload?.parts, "text/plain");
      if (!b64) { b64 = findPart(msg.payload?.parts, "text/html"); isHtml = true; }
    }
    if (!b64) return "";
    try {
      const decoded = atob(b64.replace(/-/g, "+").replace(/_/g, "/")).trim();
      return isHtml ? stripHtml(decoded) : decoded;
    } catch (_) { return ""; }
  }

  async function fetchEmailBody(tokenRecord, messageId) {
    const token = await getValidToken(tokenRecord);
    const resp = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.json();
  }

  async function expandEmail(email, tokenRecord) {
    // Toggle closed
    if (expandedEmailId === email.id) { setExpandedEmailId(null); return; }
    setExpandedEmailId(email.id);
    // Already cached
    if (emailBodies[email.id] !== undefined) return;
    setBodyLoading(l => ({ ...l, [email.id]: true }));
    try {
      const fullMsg = await fetchEmailBody(tokenRecord, email.id);
      setEmailBodies(b => ({ ...b, [email.id]: extractBody(fullMsg) || "(Empty)" }));
    } catch (_) {
      setEmailBodies(b => ({ ...b, [email.id]: "(Could not load body)" }));
    }
    setBodyLoading(l => ({ ...l, [email.id]: false }));
  }

  async function fetchEmailsForAccount(tokenRecord) {
    setGmailLoading(l => ({ ...l, [tokenRecord.id]: true }));
    try {
      const token = await getValidToken(tokenRecord);
      const listResp = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages?q=is:starred&maxResults=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = await listResp.json();
      if (!listData.messages) { setGmailEmails(e => ({ ...e, [tokenRecord.id]: [] })); return; }

      const msgs = await Promise.all(
        listData.messages.slice(0, 15).map(m =>
          fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.json())
        )
      );

      const emails = msgs.map(msg => {
        const headers = msg.payload?.headers || [];
        const h = name => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        return {
          id: msg.id,
          threadId: msg.threadId,
          from: h("From"),
          subject: h("Subject") || "(no subject)",
          date: h("Date"),
          snippet: msg.snippet || "",
          unread: (msg.labelIds || []).includes("UNREAD"),
        };
      });

      setGmailEmails(e => ({ ...e, [tokenRecord.id]: emails }));
    } catch (err) {
      console.error("fetchEmailsForAccount error:", err);
      alert("Error loading Gmail: " + err.message);
    }
    setGmailLoading(l => ({ ...l, [tokenRecord.id]: false }));
  }

  async function createTaskFromEmail(email, tokenRecord) {
    const fullMsg = await fetchEmailBody(tokenRecord, email.id);
    const body = extractBody(fullMsg);
    const senderName = email.from.replace(/<[^>]+>/, "").trim();
    setDrawer({
      open: true,
      task: null,
      forceCtx: tokenRecord.ctx,
      prefill: {
        subject: email.subject,
        description: `From: ${senderName}\n\n${body}`.trim(),
      },
    });
  }

  async function dismissEmail(emailId, tokenRecord) {
    // Remove from view immediately (optimistic)
    setDismissedEmailIds(s => new Set([...s, emailId]));
    // Unstar in Gmail so it won't reappear
    try {
      const token = await getValidToken(tokenRecord);
      await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${emailId}/modify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ removeLabelIds: ["STARRED"] }),
      });
    } catch (err) {
      console.error("Failed to unstar email:", err);
    }
  }

  async function disconnectGmail(tokenId) {
    await supabase.from("gmail_tokens").delete().eq("id", tokenId);
    setGmailTokens(ts => ts.filter(t => t.id !== tokenId));
    setGmailEmails(e => { const n = { ...e }; delete n[tokenId]; return n; });
  }

  // ── End Gmail helpers ─────────────────────────────────────────────────────

  const inboxCount = tasks.filter(t => !t.done && t.inbox).length;

  function applyFilters(list, f, s) {
    if (f.pri !== "all") list = list.filter(t => t.priority === f.pri);
    if (f.status !== "all") list = list.filter(t => t.status === f.status);
    if (f.tag.length > 0) list = list.filter(t => f.tag.some(tag => (t.tags || []).includes(tag)));
    if (f.date === "today") list = list.filter(t => t.due === TODAY);
    else if (f.date === "tomorrow") list = list.filter(t => t.due === TOMORROW);
    else if (f.date === "this-week") { const r = weekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "next-week") { const r = nextWeekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "this-month") { const r = monthRange(0); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "next-month") { const r = monthRange(1); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    const sortKey = s !== undefined ? s : sort;
    if (sortKey === "pri") { const o = { p1: 0, p2: 1, p3: 2, p4: 3 }; list = [...list].sort((a, b) => (o[a.priority] || 3) - (o[b.priority] || 3)); }
    else if (sortKey === "due") list = [...list].sort((a, b) => (a.due || "9999") > (b.due || "9999") ? 1 : -1);
    else if (sortKey === "status") list = [...list].sort((a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status));
    return list;
  }

  function getForceCtx() {
    if (view === "client") return "business";
    if (view === "project") {
      const proj = projectById(currentProj);
      return proj ? proj.ctx : globalCtx;
    }
    return globalCtx;
  }

  function getPrefill() {
    const p = {};
    if (view === "client") p.client_id = currentClient;
    if (view === "project") {
      p.project_id = currentProj;
      const proj = projectById(currentProj);
      if (proj?.client_id) p.client_id = proj.client_id;
    }
    return p;
  }

  function openNewTask() {
    setDrawer({ open: true, task: null, forceCtx: getForceCtx(), prefill: getPrefill() });
  }

  function openEdit(task) {
    setDrawer({ open: true, task, forceCtx: task.ctx, prefill: {} });
  }

  function closeDrawer() { setDrawer(d => ({ ...d, open: false })); }

  async function saveTask(form) {
    const isEdit = !!drawer.task;
    const payload = {
      user_id: user.id,
      subject: form.subject,
      description: form.description || null,
      priority: form.priority || "p2",
      status: form.status || "Not Started",
      due: form.due || null,
      inbox: !form.due,
      done: false,
      done_at: null,
      ctx: form.ctx,
      project_id: form.project_id || null,
      client_id: form.client_id || null,
      tags: form.tags || [],
      reminder: form.reminder || false,
      reminder_at: form.reminder_at || null,
      recurring: form.recurring || "none",
    };
    if (isEdit) {
      payload.done = drawer.task.done;
      payload.done_at = drawer.task.done_at;
      const { data, error } = await supabase.from("tasks").update(payload).eq("id", drawer.task.id).select().single();
      if (error) { console.error("saveTask error:", error.message); return; }
      if (data) setTasks(ts => ts.map(t => t.id === data.id ? data : t));
    } else {
      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error) { console.error("saveTask error:", error.message); return; }
      if (data) setTasks(ts => [...ts, data]);
    }
    closeDrawer();
  }

  async function deleteTask() {
    const id = drawer.task.id;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(ts => ts.filter(t => t.id !== id));
    closeDrawer();
  }

  async function toggleDone(id, undo = false) {
    if (undo) {
      const updates = { done: false, done_at: null, status: "Not Started" };
      await supabase.from("tasks").update(updates).eq("id", id);
      setTasks(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t));
      setToast(null);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      return;
    }
    const task = tasks.find(t => t.id === id);
    const updates = { done: true, done_at: TODAY, status: "Complete" };
    const { data } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
    if (data) setTasks(ts => ts.map(t => t.id === id ? data : t));
    // Handle recurring
    if (task?.recurring && task.recurring !== "none") {
      const { id: _id, created_at: _ca, ...rest } = task;
      const newTask = { ...rest, user_id: user.id, done: false, done_at: null, status: "Not Started" };
      const { data: nd } = await supabase.from("tasks").insert(newTask).select().single();
      if (nd) setTasks(ts => [...ts, nd]);
    }
    if (task) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id, subject: task.subject });
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    }
  }

  async function archiveProject(id, archived) {
    const { data } = await supabase.from("projects").update({ archived }).eq("id", id).select().single();
    if (data) setProjects(ps => ps.map(p => p.id === id ? data : p));
  }

  function navToTag(tag) {
    setCurrentTag(tag); setView("tag-view"); setMenuOpen(false);
    setFiltersRaw({ ...EMPTY_FILTERS }); setSortRaw(EMPTY_SORT);
  }

  function navTo(v, client = "", proj = "") {
    setView(v); setCurrentClient(client); setCurrentProj(proj); setMenuOpen(false);
    setFiltersRaw(contextFilters[globalCtx] || { ...EMPTY_FILTERS });
    setSortRaw(contextSort[globalCtx] || EMPTY_SORT);
  }

  function switchCtxGlobal(ctx) {
    setGlobalCtx(ctx);
    setFiltersRaw(contextFilters[ctx] || { ...EMPTY_FILTERS });
    setSortRaw(contextSort[ctx] || EMPTY_SORT);
  }

  function getTaskList() {
    let list = tasks.filter(t => !t.done && t.ctx === globalCtx);
    if (view === "inbox") list = list.filter(t => t.inbox);
    else if (view === "today") list = list.filter(t => t.due === TODAY);
    else if (view === "tomorrow") list = list.filter(t => t.due === TOMORROW);
    else if (view === "business") list = list.filter(t => t.ctx === "business");
    else if (view === "personal") list = list.filter(t => t.ctx === "personal");
    else if (view === "client") list = list.filter(t => t.client_id === currentClient);
    else if (view === "tag-view") list = list.filter(t => (t.tags || []).includes(currentTag));
    else if (view === "week") { const r = weekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (view === "month") { const r = monthRange(0); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    return applyFilters(list, filters);
  }

  const VIEWS_WITH_FILTERS = ["all", "inbox", "today", "tomorrow", "business", "personal", "client-view", "week", "month", "tag-view", "completed"];
  const showFab = !["settings", "gmail"].includes(view);
  const showFilters = VIEWS_WITH_FILTERS.includes(view);

  const viewTitles = { inbox: "Inbox", today: "Today", tomorrow: "Tomorrow", all: "All Tasks", week: "This Week", month: "This Month", cal: "Calendar", completed: "Completed", business: "Business", personal: "Personal", gmail: "Gmail", settings: "Settings", client: clientName(currentClient), project: projectById(currentProj)?.name || currentProj, "tag-view": `#${currentTag}` };

  const removeTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  function renderTaskList(list, draggable = false) {
    if (!list.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing here</div>;
    return list.map(t => (
      <TaskRow key={t.id} task={t} clientLabel={clientName(t.client_id)} onDone={toggleDone} onEdit={openEdit} onDelete={removeTask}
        onSelect={toggleSelect} isSelected={selectedIds.has(t.id)}
        draggable={draggable && selectedIds.size === 0}
        onDragStart={() => { dragSrc.current = t.id; }}
        onDrop={() => {
          if (dragSrc.current === t.id) return;
          const srcId = dragSrc.current; dragSrc.current = null;
          setTasks(ts => {
            const arr = [...ts]; const si = arr.findIndex(x => x.id === srcId); const ti = arr.findIndex(x => x.id === t.id);
            const [m] = arr.splice(si, 1); arr.splice(ti, 0, m);
            return [...arr];
          });
        }}
      />
    ));
  }

  function renderTomorrow() {
    const list = tasks.filter(t => !t.done && t.ctx === globalCtx && t.due === TOMORROW);
    const filtered = applyFilters(list, filters);
    if (!filtered.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing due tomorrow</div>;
    return [["p1", "High priority"], ["p2", "Medium priority"], ["p3", "Other"]].map(([pri, label]) => {
      const items = filtered.filter(t => pri === "p3" ? ["p3", "p4"].includes(t.priority) : t.priority === pri);
      if (!items.length) return null;
      return <div key={pri}><SectionHeader>{label}</SectionHeader>{renderTaskList(items)}</div>;
    });
  }

  function renderToday() {
    const list = getTaskList();
    if (!list.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing due today</div>;
    return [["p1", "High priority"], ["p2", "Medium priority"], ["p3", "Other"]].map(([pri, label]) => {
      const items = list.filter(t => pri === "p3" ? ["p3", "p4"].includes(t.priority) : t.priority === pri);
      if (!items.length) return null;
      return <div key={pri}><SectionHeader>{label}</SectionHeader>{renderTaskList(items)}</div>;
    });
  }

  function renderWeek() {
    const r = weekRange(), names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(r.start + "T00:00:00"); d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10), isToday = ds === TODAY;
      let dayTasks = tasks.filter(t => !t.done && t.ctx === globalCtx && t.due === ds);
      dayTasks = applyFilters(dayTasks, filters);
      return (
        <div key={ds}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (!dragSrc.current) return;
            const srcId = dragSrc.current; dragSrc.current = null;
            setTasks(ts => ts.map(t => t.id === srcId ? { ...t, due: ds, inbox: false } : t));
            supabase.from("tasks").update({ due: ds, inbox: false }).eq("id", srcId);
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? D.accent : D.textMuted, padding: "7px 13px 3px", background: D.bgSurface, borderBottom: `0.5px solid ${D.border}`, display: "flex", justifyContent: "space-between" }}>
            <span>{names[i]} {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{isToday ? " · Today" : ""}</span>
            <span style={{ fontSize: 12, color: D.textFaint }}>{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {dayTasks.length
            ? dayTasks.map(t => (
                <TaskRow key={t.id} task={t} clientLabel={clientName(t.client_id)} onDone={toggleDone} onEdit={openEdit} onDelete={removeTask}
                  onSelect={toggleSelect} isSelected={selectedIds.has(t.id)} draggable={selectedIds.size === 0}
                  onDragStart={() => { dragSrc.current = t.id; }}
                  onDrop={() => {}}
                />
              ))
            : <div style={{ padding: "10px 13px", fontSize: 13, color: D.textFaint, fontStyle: "italic" }}>Drop tasks here</div>
          }
        </div>
      );
    });
  }

  function renderMonth() {
    const r = monthRange(0);
    let list = tasks.filter(t => !t.done && t.ctx === globalCtx && t.due && inRange(t.due, r.start, r.end));
    list = applyFilters(list, filters);
    const byDate = {};
    list.forEach(t => { if (!byDate[t.due]) byDate[t.due] = []; byDate[t.due].push(t); });
    if (!Object.keys(byDate).length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing this month</div>;
    return Object.keys(byDate).sort().map(d => {
      const dt = new Date(d + "T00:00:00");
      return <div key={d}><SectionHeader>{dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</SectionHeader>{renderTaskList(byDate[d])}</div>;
    });
  }

  function renderProject() {
    const pt = tasks.filter(t => t.project_id === currentProj);
    const done = pt.filter(t => t.done).length, total = pt.length, pct = total ? Math.round(done / total * 100) : 0;
    const open = pt.filter(t => !t.done), closed = pt.filter(t => t.done);
    const proj = projectById(currentProj);
    return (
      <div>
        <div style={{ padding: 13, borderBottom: `0.5px solid ${D.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: D.text }}>{currentProj}</div>
            <button onClick={async () => { await archiveProject(currentProj, !proj?.archived); navTo("inbox"); }}
              style={{ fontSize: 12, padding: "3px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer" }}>
              {proj?.archived ? "Restore" : "Archive"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {proj && <Chip style={proj.ctx === "business"
              ? { background: D.projBusinessBg, color: D.projBusinessColor }
              : { background: D.projPersonalBg, color: D.projPersonalColor }}>
              {proj.ctx === "business" ? "Business" : "Personal"}
            </Chip>}
            {proj?.client_id && <Chip style={{ background: D.projClientBg, color: D.projClientColor }}>{clientName(proj.client_id)}</Chip>}
          </div>
          <div style={{ height: 5, background: D.bgHover, borderRadius: 3, margin: "6px 0 4px" }}>
            <div style={{ height: "100%", borderRadius: 3, background: D.progressBar, width: pct + "%" }} />
          </div>
          <div style={{ fontSize: 13, color: D.textMuted }}>{done} of {total} tasks complete · {pct}%</div>
        </div>
        {open.length > 0 && <><SectionHeader>Open</SectionHeader>{renderTaskList(open)}</>}
        {closed.length > 0 && <><SectionHeader>Completed</SectionHeader>{renderTaskList(closed)}</>}
        {!pt.length && <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>No tasks in this project</div>}
      </div>
    );
  }

  function renderCompleted() {
    let done = tasks.filter(t => t.done && t.ctx === globalCtx);
    if (filters.pri !== "all") done = done.filter(t => t.priority === filters.pri);
    if (filters.tag.length > 0) done = done.filter(t => filters.tag.some(tag => (t.tags || []).includes(tag)));
    if (filters.status !== "all") done = done.filter(t => t.status === filters.status);
    if (filters.proj !== "all") done = done.filter(t => t.project_id === filters.proj);
    if (filters.client !== "all") done = done.filter(t => t.client_id === filters.client);
    if (filters.date === "today") done = done.filter(t => t.done_at === TODAY);
    else if (filters.date === "tomorrow") done = done.filter(t => t.done_at === TOMORROW);
    else if (filters.date === "this-week") { const r = weekRange(); done = done.filter(t => inRange(t.done_at, r.start, r.end)); }
    else if (filters.date === "next-week") { const r = nextWeekRange(); done = done.filter(t => inRange(t.done_at, r.start, r.end)); }
    else if (filters.date === "this-month") { const r = monthRange(0); done = done.filter(t => inRange(t.done_at, r.start, r.end)); }
    else if (filters.date === "next-month") { const r = monthRange(1); done = done.filter(t => inRange(t.done_at, r.start, r.end)); }
    const tw = weekRange();
    const grouped = {};
    done.forEach(t => { const k = t.done_at || "Recently"; if (!grouped[k]) grouped[k] = []; grouped[k].push(t); });
    return (
      <div>
        <div style={{ display: "flex", borderBottom: `0.5px solid ${D.border}` }}>
          {[["Total", done.length], ["This week", done.filter(t => t.done_at && inRange(t.done_at, tw.start, tw.end)).length], ["Business", done.filter(t => t.ctx === "business").length]].map(([l, n]) => (
            <div key={l} style={{ flex: 1, textAlign: "center", padding: "11px 6px", borderRight: `0.5px solid ${D.completedDivider}` }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: D.text }}>{n}</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {done.length === 0 && <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>No completed tasks yet</div>}
        {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(k => (
          <div key={k}><SectionHeader>{fmtDoneDate(k)}</SectionHeader>{grouped[k].map(t => <TaskRow key={t.id} task={t} clientLabel={clientName(t.client_id)} onDone={toggleDone} onEdit={openEdit} onDelete={removeTask} onSelect={toggleSelect} isSelected={selectedIds.has(t.id)} />)}</div>
        ))}
      </div>
    );
  }

  function calDayClick(ds) {
    let list = tasks.filter(t => !t.done && t.due === ds);
    list = applyFilters(list, calFilters);
    const dt = new Date(ds + "T00:00:00");
    setCalDayLabel(dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    setCalDayTasks(list);
    setSelectedCalDay(ds);
  }

  function renderCalendar() {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const mName = new Date(calYear, calMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const byDate = {};
    tasks.filter(t => !t.done && t.due).forEach(t => { if (!byDate[t.due]) byDate[t.due] = []; byDate[t.due].push(t); });
    const empties = firstDay === 0 ? 6 : firstDay - 1;
    const cells = [];
    for (let i = 0; i < empties; i++) cells.push(<div key={"e" + i} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = ds === TODAY, hasTasks = byDate[ds]?.length, isSel = ds === selectedCalDay;
      cells.push(
        <div key={day} onClick={() => calDayClick(ds)} style={{ fontSize: 14, padding: "6px 2px", cursor: "pointer", borderRadius: 8, textAlign: "center", position: "relative", background: isSel ? D.calSelectedBg : isToday ? D.calTodayBg : "transparent", color: isSel ? D.calSelectedColor : isToday ? D.calTodayColor : D.textMuted, fontWeight: isToday || isSel ? 600 : 400 }}>
          {day}
          {hasTasks && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? D.calSelectedColor : D.calDot, margin: "2px auto 0" }} />}
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderBottom: `0.5px solid ${D.border}` }}>
          <button onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); setSelectedCalDay(null); setCalDayTasks([]); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: D.textMuted }}>‹</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: D.text }}>{mName}</span>
          <button onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); setSelectedCalDay(null); setCalDayTasks([]); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: D.textMuted }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px" }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} style={{ fontSize: 12, fontWeight: 600, color: D.textFaint, padding: "5px 0", textAlign: "center" }}>{d}</div>)}
          {cells}
        </div>
        {selectedCalDay && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 13px 3px", background: D.bgSurface, borderBottom: `0.5px solid ${D.border}`, borderTop: `0.5px solid ${D.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{calDayLabel}{calDayTasks.length > 0 ? ` · ${calDayTasks.length}` : ""}</span>
              <FilterDropdown filters={calFilters} setFilters={f => { setCalFilters(f); if (selectedCalDay) calDayClick(selectedCalDay); }} filterTags={filterTags} statuses={statuses} />
            </div>
            {calDayTasks.length > 0 ? renderTaskList(calDayTasks) : <div style={{ padding: "10px 13px", fontSize: 14, color: D.textFaint }}>No tasks due this day</div>}
          </div>
        )}
      </div>
    );
  }

  function renderGmail() {
    const ctxTokens = gmailTokens.filter(t => t.ctx === globalCtx);
    if (!ctxTokens.length) {
      return (
        <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>
          No {globalCtx} Gmail accounts linked.<br />
          <span style={{ fontSize: 14 }}>Add one in Settings.</span>
        </div>
      );
    }
    return (
      <div>
        {ctxTokens.map(tokenRecord => {
          const allEmails = gmailEmails[tokenRecord.id] || [];
          const emails = allEmails.filter(e => !dismissedEmailIds.has(e.id));
          const loading = !!gmailLoading[tokenRecord.id];
          const loaded = tokenRecord.id in gmailEmails;
          const senderLabel = raw => raw.replace(/<[^>]+>/, "").trim() || raw;
          const formatEmailDate = raw => {
            if (!raw) return "";
            const d = new Date(raw);
            if (isNaN(d)) return raw;
            const isToday = d.toLocaleDateString("en-CA") === TODAY;
            if (isToday) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            return d.toLocaleDateString([], { month: "short", day: "numeric" });
          };

          return (
            <div key={tokenRecord.id}>
              {/* Account header */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", background: globalCtx === "business" ? D.gmailBizBg : D.gmailPersonalBg, borderBottom: `0.5px solid ${D.borderMed}`, fontSize: 14, color: D.text, fontWeight: 500 }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tokenRecord.email}</span>
                <Chip style={{ background: D.accentBg, color: D.accent, flexShrink: 0 }}>{tokenRecord.ctx}</Chip>
                <button onClick={() => fetchEmailsForAccount(tokenRecord)}
                  style={{ fontSize: 12, padding: "2px 8px", borderRadius: 7, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer", flexShrink: 0 }}>
                  {loading ? "…" : "↺"}
                </button>
              </div>

              {/* Not yet loaded */}
              {!loaded && !loading && (
                <div style={{ padding: "16px 13px", textAlign: "center" }}>
                  <button onClick={() => fetchEmailsForAccount(tokenRecord)}
                    style={{ fontSize: 14, padding: "6px 14px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer" }}>
                    Load emails
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading && <div style={{ padding: "12px 13px", fontSize: 14, color: D.textFaint }}>Loading…</div>}

              {/* Empty */}
              {loaded && !loading && emails.length === 0 && (
                <div style={{ padding: "12px 13px", fontSize: 14, color: D.textFaint }}>No starred emails</div>
              )}

              {/* Email rows */}
              {emails.map(email => {
                const isExpanded = expandedEmailId === email.id;
                return (
                  <div key={email.id} style={{ borderBottom: `0.5px solid ${D.border}` }}>
                    {/* Tappable header row */}
                    <div onClick={() => expandEmail(email, tokenRecord)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", cursor: "pointer" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: email.unread ? 600 : 500, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {senderLabel(email.from)}
                          </div>
                          <div style={{ fontSize: 12, color: D.textFaint, flexShrink: 0 }}>{formatEmailDate(email.date)}</div>
                        </div>
                        <div style={{ fontSize: 14, color: email.unread ? D.text : D.textFaint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {email.subject}
                        </div>
                        {!isExpanded && (
                          <div style={{ fontSize: 12, color: D.textFaint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {email.snippet}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); createTaskFromEmail(email, tokenRecord); }}
                          style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer" }}>
                          + Task
                        </button>
                        <button onClick={e => { e.stopPropagation(); dismissEmail(email.id, tokenRecord); }}
                          style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.border}`, background: "transparent", color: D.textFaint, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                    {/* Expanded body */}
                    {isExpanded && (
                      <div style={{ padding: "0 13px 14px 13px", borderTop: `0.5px solid ${D.border}` }}>
                        {bodyLoading[email.id]
                          ? <div style={{ fontSize: 13, color: D.textFaint, paddingTop: 10 }}>Loading…</div>
                          : <div style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.65, whiteSpace: "pre-wrap", paddingTop: 10, maxHeight: 320, overflowY: "auto" }}>
                              {emailBodies[email.id] || ""}
                            </div>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderSettings() {
    const strSections = [
      { label: "Statuses", key: "st", list: statuses, setList: setStatuses },
      { label: "Task Types", key: "ty", list: taskTypes, setList: setTaskTypes },
      { label: "Filter Tags", key: "ft", list: filterTags, setList: setFilterTags },
    ];
    const inp = { flex: 1, fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text };
    const sectionPad = { padding: 13, borderBottom: `0.5px solid ${D.border}` };

    const addProject = async () => {
      const v = newProjForm.name.trim();
      if (!v || projects.find(p => p.name === v)) return;
      const { data } = await supabase.from("projects").insert({ user_id: user.id, name: v, ctx: newProjForm.ctx, client_id: newProjForm.client_id || null, archived: false }).select().single();
      if (data) setProjects(ps => [...ps, data]);
      setNewProjForm({ name: "", ctx: "business", client_id: "" });
    };
    const removeProject = async (id) => {
      await supabase.from("projects").delete().eq("id", id);
      setProjects(ps => ps.filter(p => p.id !== id));
    };
    const addClient = async () => {
      const v = newClientForm.name.trim();
      if (!v || clients.find(c => c.name === v)) return;
      const { data } = await supabase.from("clients").insert({ user_id: user.id, name: v, ctx: newClientForm.ctx }).select().single();
      if (data) setClients(cs => [...cs, data]);
      setNewClientForm({ name: "", ctx: "business" });
    };
    const removeClient = async (id) => {
      await supabase.from("clients").delete().eq("id", id);
      setClients(cs => cs.filter(c => c.id !== id));
    };

    return (
      <div>
        {/* Color scheme */}
        <div style={sectionPad}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 10 }}>Color scheme</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(THEMES).map(name => {
              const t = THEMES[name];
              const active = selectedTheme === name;
              return (
                <button key={name} onClick={() => setSelectedTheme(name)}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 10, border: `1.5px solid ${active ? D.accent : D.borderMed}`, background: active ? D.accentBg : D.bgRaised, cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? D.accent : D.textMuted }}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {strSections.map(s => (
          <div key={s.key} style={sectionPad}>
            <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>{s.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
              {s.list.map(item => (
                <span key={item} style={{ fontSize: 13, padding: "3px 9px", borderRadius: 20, border: `0.5px solid ${D.borderMed}`, color: D.textMuted, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {item}<span onClick={() => s.setList(l => l.filter(x => x !== item))} style={{ cursor: "pointer" }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newInputs[s.key] || ""} onChange={e => setNewInputs(n => ({ ...n, [s.key]: e.target.value }))} placeholder="New…" style={inp} />
              <button onClick={() => { const v = (newInputs[s.key] || "").trim(); if (v && !s.list.includes(v)) { s.setList(l => [...l, v]); setNewInputs(n => ({ ...n, [s.key]: "" })); } }} style={{ fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer" }}>+ Add</button>
            </div>
          </div>
        ))}

        {/* Clients */}
        <div style={sectionPad}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>Clients</div>
          {clients.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${D.border}`, fontSize: 14 }}>
              <span style={{ flex: 1, color: D.text }}>{c.name}</span>
              <Chip style={c.ctx === "business" ? { background: D.projBusinessBg, color: D.projBusinessColor } : { background: D.projPersonalBg, color: D.projPersonalColor }}>{c.ctx}</Chip>
              <span onClick={() => removeClient(c.id)} style={{ cursor: "pointer", color: D.textFaint, fontSize: 16 }}>×</span>
            </div>
          ))}
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            <input value={newClientForm.name} onChange={e => setNewClientForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name" style={inp} />
            <select value={newClientForm.ctx} onChange={e => setNewClientForm(f => ({ ...f, ctx: e.target.value }))} style={{ fontSize: 14, padding: "5px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }}>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <button onClick={addClient} style={{ marginTop: 7, fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer", width: "100%" }}>+ Add client</button>
        </div>

        {/* Projects */}
        <div style={sectionPad}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>Projects</div>
          {projects.filter(p => !p.archived).map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${D.border}`, fontSize: 14 }}>
              <span style={{ flex: 1, color: D.text }}>{p.name}</span>
              <Chip style={p.ctx === "business"
                ? { background: D.projBusinessBg, color: D.projBusinessColor }
                : { background: D.projPersonalBg, color: D.projPersonalColor }}>{p.ctx}</Chip>
              {p.client_id && <Chip style={{ background: D.projClientBg, color: D.projClientColor }}>{clientName(p.client_id)}</Chip>}
              <span onClick={() => removeProject(p.id)} style={{ cursor: "pointer", color: D.textFaint, fontSize: 16 }}>×</span>
            </div>
          ))}
          {projects.some(p => p.archived) && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: D.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Archived</div>
              {projects.filter(p => p.archived).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${D.border}`, fontSize: 14, opacity: 0.6 }}>
                  <span style={{ flex: 1, color: D.textMuted }}>{p.name}</span>
                  <span onClick={() => archiveProject(p.id, false)}
                    style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, cursor: "pointer", color: D.textMuted }}>Restore</span>
                  <span onClick={() => removeProject(p.id)} style={{ cursor: "pointer", color: D.textFaint, fontSize: 16 }}>×</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <input value={newProjForm.name} onChange={e => setNewProjForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" style={{ ...inp, gridColumn: "1 / -1" }} />
            <select value={newProjForm.ctx} onChange={e => setNewProjForm(f => ({ ...f, ctx: e.target.value }))} style={inp}>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
            <select value={newProjForm.client_id} onChange={e => setNewProjForm(f => ({ ...f, client_id: e.target.value }))} style={inp}>
              <option value="">No client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button onClick={addProject} style={{ marginTop: 7, fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer", width: "100%" }}>+ Add project</button>
        </div>

        {/* Gmail accounts */}
        <div style={{ padding: 13 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>Gmail accounts <span style={{ fontSize: 13, color: D.textMuted, fontWeight: 400 }}>(up to 3)</span></div>
          {gmailTokens.map(token => (
            <div key={token.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `0.5px solid ${D.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{token.email}</div>
                <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>{token.ctx}</div>
              </div>
              <button onClick={() => disconnectGmail(token.id)}
                style={{ fontSize: 13, padding: "3px 9px", borderRadius: 8, border: `0.5px solid ${D.dangerBorder}`, background: "transparent", cursor: "pointer", color: D.danger, flexShrink: 0 }}>
                Disconnect
              </button>
            </div>
          ))}
          {gmailTokens.length === 0 && (
            <div style={{ fontSize: 14, color: D.textFaint, marginBottom: 10 }}>No accounts connected yet.</div>
          )}
          {gmailTokens.length < 3 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => connectGmail("business")}
                style={{ flex: 1, fontSize: 14, padding: "7px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer" }}>
                + Business Gmail
              </button>
              <button onClick={() => connectGmail("personal")}
                style={{ flex: 1, fontSize: 14, padding: "7px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.text, cursor: "pointer" }}>
                + Personal Gmail
              </button>
            </div>
          )}
          {gmailTokens.length >= 3 && <p style={{ fontSize: 13, color: D.textMuted, marginTop: 7 }}>Maximum of 3 accounts reached.</p>}
        </div>
      </div>
    );
  }

  function renderMainContent() {
    if (view === "gmail") return renderGmail();
    if (view === "settings") return renderSettings();
    if (view === "completed") return renderCompleted();
    if (view === "cal") return renderCalendar();
    if (view === "week") return renderWeek();
    if (view === "month") return renderMonth();
    if (view === "project") return renderProject();
    if (view === "today") return renderToday();
    if (view === "tomorrow") return renderTomorrow();
    const list = getTaskList();
    return renderTaskList(list, view === "all" && sort === "manual");
  }

  const mItem = (isActive) => ({
    display: "flex", alignItems: "center", gap: 9, padding: "9px 14px",
    fontSize: 15, cursor: "pointer", userSelect: "none",
    color: isActive ? D.text : D.textMuted,
    borderLeft: isActive ? `2px solid ${D.accent}` : "2px solid transparent",
    background: isActive ? D.bgRaised : "transparent",
    transition: "background .12s",
  });

  const accordHdr = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: 12, fontWeight: 600, color: D.textFaint,
    padding: "9px 14px 6px", letterSpacing: "0.06em", textTransform: "uppercase",
    cursor: "pointer", userSelect: "none",
  };

  if (!authReady) return null;
  if (!user) return <LoginScreen />;

  return (
    <ThemeContext.Provider value={D}>
      <div>
        <div onTouchStart={handleSwipeStart} onTouchEnd={handleSwipeEnd} style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", background: D.bg, position: "relative", overflow: "hidden" }}>

          {menuOpen && (
            <div onClick={() => setMenuOpen(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 59 }} />
          )}

          {/* SIDEBAR */}
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: 260,
            background: D.bgSurface, borderRight: `0.5px solid ${D.borderMed}`,
            zIndex: 60,
            transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform .25s ease",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "16px 14px 10px", paddingTop: "calc(16px + env(safe-area-inset-top))", borderBottom: `0.5px solid ${D.border}`, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", lineHeight: 1, color: D.text }}>
                <span style={{ fontSize: 22 }}>P</span><span style={{ fontSize: 13, letterSpacing: "0.18em" }}>OISED</span>
              </div>
              <div style={{ fontSize: 13, color: D.textFaint, marginTop: 2 }}>{user?.email}</div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ padding: "6px 0 2px" }}>
                {[{ id: "inbox", label: "Inbox", icon: Tray }, { id: "today", label: "Today", icon: CalendarDot }, { id: "tomorrow", label: "Tomorrow", icon: CalendarPlus }].map(m => (
                  <div key={m.id} onClick={() => navTo(m.id)} style={mItem(view === m.id)}><m.icon size={16} weight="light" />{m.label}</div>
                ))}
              </div>

              <div style={{ borderTop: `0.5px solid ${D.border}` }}>
                <div onClick={() => setAccordionOpen(a => ({ ...a, views: !a.views }))} style={accordHdr}>
                  <span>More views</span>
                  <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.views ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
                </div>
                {accordionOpen.views && [
                  { id: "week", label: "This Week", icon: CalendarDots },
                  { id: "month", label: "This Month", icon: CalendarBlank },
                  { id: "all", label: "All Tasks", icon: SquaresFour },
                  { id: "cal", label: "Calendar", icon: Calendar },
                  { id: "completed", label: "Completed", icon: CheckCircle },
                ].map(m => (
                  <div key={m.id} onClick={() => navTo(m.id)} style={mItem(view === m.id)}><m.icon size={16} weight="light" />{m.label}</div>
                ))}
              </div>

              {globalCtx !== "personal" && (
                <div style={{ borderTop: `0.5px solid ${D.border}` }}>
                  <div onClick={() => setAccordionOpen(a => ({ ...a, clients: !a.clients }))} style={accordHdr}>
                    <span>Clients</span>
                    <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.clients ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
                  </div>
                  {accordionOpen.clients && clients.map(c => (
                    <div key={c.id} onClick={() => navTo("client", c.id)} style={mItem(view === "client" && currentClient === c.id)}>{c.name}</div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: `0.5px solid ${D.border}` }}>
                <div onClick={() => setAccordionOpen(a => ({ ...a, projects: !a.projects }))} style={accordHdr}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FolderSimple size={14} weight="light" />Projects</span>
                  <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.projects ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
                </div>
                {accordionOpen.projects && projects.filter(p => !p.archived).map(p => (
                  <div key={p.name} onClick={() => navTo("project", "", p.name)} style={mItem(view === "project" && currentProj === p.name)}>{p.name}</div>
                ))}
                {accordionOpen.projects && projects.some(p => p.archived) && (
                  <div style={{ paddingLeft: 8 }}>
                    <div onClick={() => setAccordionOpen(a => ({ ...a, archivedProjects: !a.archivedProjects }))} style={{ ...accordHdr, paddingLeft: 8, fontSize: 11, color: D.textFaint }}>
                      <span>Archived</span>
                      <span style={{ fontSize: 12, transition: "transform .2s", display: "inline-block", transform: accordionOpen.archivedProjects ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                    </div>
                    {accordionOpen.archivedProjects && projects.filter(p => p.archived).map(p => (
                      <div key={p.name} onClick={() => navTo("project", "", p.name)} style={{ ...mItem(view === "project" && currentProj === p.name), opacity: 0.5, paddingLeft: 8 }}>{p.name}</div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: `0.5px solid ${D.border}` }}>
                <div onClick={() => setAccordionOpen(a => ({ ...a, tags: !a.tags }))} style={accordHdr}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Hash size={14} weight="light" />Tags</span>
                  <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.tags ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
                </div>
                {accordionOpen.tags && filterTags.map(tag => (
                  <div key={tag} onClick={() => navToTag(tag)} style={mItem(view === "tag-view" && currentTag === tag)}>#{tag}</div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `0.5px solid ${D.border}`, flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div onClick={() => navTo("gmail")} style={mItem(view === "gmail")}><Envelope size={16} weight="light" />Gmail</div>
              <div onClick={() => navTo("settings")} style={mItem(view === "settings")}><Gear size={16} weight="light" />Settings</div>
              <div onClick={() => supabase.auth.signOut()} style={{ ...mItem(false), color: D.textFaint, fontSize: 13 }}>Sign out</div>
            </div>
          </div>

          {/* TOPBAR */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px", paddingTop: "env(safe-area-inset-top)", height: "calc(48px + env(safe-area-inset-top))", borderBottom: `0.5px solid ${D.border}`, flexShrink: 0 }}>
            <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: D.text, display: "flex", alignItems: "center", fontSize: 26 }}>☰</button>
            <h2 style={{ flex: 1, fontSize: 17, fontWeight: 600, color: D.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewTitles[view] || view}</h2>
            {view === "completed" && (
              <button onClick={async () => { const ids = tasks.filter(t => t.done).map(t => t.id); if (ids.length) await supabase.from("tasks").delete().in("id", ids); setTasks(ts => ts.filter(t => !t.done)); }}
                style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.dangerBorder}`, background: "transparent", color: D.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                Clear
              </button>
            )}
            {showFilters && (
              <>
                <SortDropdown sort={sort} setSort={setSort} />
                <FilterDropdown filters={filters} setFilters={setFilters} filterTags={filterTags} statuses={statuses}
                  extraGroups={view === "completed" ? [
                    { key: "proj", label: "Project", opts: [["all", "Any"], ...projects.map(p => [p.id, p.name])] },
                    { key: "client", label: "Client", opts: [["all", "Any"], ...clients.map(c => [c.id, c.name])] },
                  ] : []}
                />
              </>
            )}
          </div>

          {/* CONTEXT SWITCHER */}
          <div style={{ display: "flex", background: D.bgSurface, borderBottom: `0.5px solid ${D.borderMed}`, flexShrink: 0, padding: "0 12px", gap: 4 }}>
            {[["personal", "Personal", UserCircle], ["business", "Business", Briefcase]].map(([ctx, label, Icon]) => {
              const active = globalCtx === ctx;
              return (
                <button key={ctx} onClick={() => switchCtxGlobal(ctx)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 8px", border: active ? `0.5px solid ${D.borderMed}` : "0.5px solid transparent", borderBottom: active ? `0.5px solid ${D.bgSurface}` : "0.5px solid transparent", borderRadius: "8px 8px 0 0", marginBottom: -1, cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, background: active ? D.bgRaised : "transparent", color: active ? D.text : D.textMuted, transition: "all .15s ease" }}>
                  <Icon size={16} weight="light" />{label}
                </button>
              );
            })}
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {renderMainContent()}
          </div>

          {/* UNDO TOAST */}
          {toast && (
            <div style={{ position: "absolute", bottom: 64, left: 13, right: 13, background: D.bgRaised, borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 30, border: `0.5px solid ${D.borderMed}` }}>
              <span style={{ fontSize: 14, color: D.textMuted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 10 }}>Completed: {toast.subject}</span>
              <button onClick={() => toggleDone(toast.id, true)} style={{ fontSize: 13, fontWeight: 600, color: D.accent, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Undo</button>
            </div>
          )}

          {/* BULK ACTION BAR */}
          {selectedIds.size > 0 && !bulkAction && (
            <div style={{ position: "absolute", bottom: 52, left: 0, right: 0, background: D.bgRaised, borderTop: `0.5px solid ${D.borderMed}`, zIndex: 20, padding: "10px 13px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{selectedIds.size} selected</span>
                <button onClick={exitSelect} style={{ fontSize: 13, color: D.accent, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
              </div>
              <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                {[["complete", "Complete"], ["pri", "Priority"], ["status", "Status"], ["due", "Due date"]].map(([action, label]) => (
                  <button key={action} onClick={() => action === "complete" ? applyBulkComplete() : setBulkAction(action)}
                    style={{ flex: 1, fontSize: 13, padding: "7px 4px", borderRadius: 9, border: `0.5px solid ${D.borderMed}`, background: action === "complete" ? D.success : D.bgSurface, color: action === "complete" ? "white" : D.text, cursor: "pointer", fontWeight: action === "complete" ? 600 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={applyBulkDelete}
                style={{ width: "100%", fontSize: 13, padding: "8px", borderRadius: 9, border: `0.5px solid ${D.dangerBorder}`, background: "rgba(248,113,113,0.08)", color: D.danger, cursor: "pointer", fontWeight: 600 }}>
                Delete {selectedIds.size} {selectedIds.size === 1 ? "task" : "tasks"}
              </button>
            </div>
          )}

          {/* BULK EDIT SHEET */}
          {bulkAction && (
            <div onClick={() => setBulkAction(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 48 }}>
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: D.bgSurface, borderRadius: "16px 16px 0 0", border: `0.5px solid ${D.borderMed}`, padding: "16px 13px 24px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: D.bgHover, margin: "0 auto 14px" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 12 }}>
                  {bulkAction === "pri" ? "Set priority" : bulkAction === "status" ? "Set status" : "Set due date"} · {selectedIds.size} tasks
                </div>
                {bulkAction === "pri" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                      <button key={val} onClick={() => applyBulk("priority", val)}
                        style={{ padding: "11px 14px", borderRadius: 10, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.priority[val]?.color || D.text, fontSize: 15, textAlign: "left", cursor: "pointer", fontWeight: 500 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {bulkAction === "status" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {statuses.map(s => (
                      <button key={s} onClick={() => applyBulk("status", s)}
                        style={{ padding: "11px 14px", borderRadius: 10, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.status[s]?.color || D.text, fontSize: 15, textAlign: "left", cursor: "pointer", fontWeight: 500 }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                {bulkAction === "due" && (
                  <div>
                    <input type="date" value={bulkDue} onChange={e => setBulkDue(e.target.value)}
                      style={{ width: "100%", fontSize: 15, padding: "10px 12px", borderRadius: 10, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.text, boxSizing: "border-box", marginBottom: 12 }} />
                    <button onClick={() => bulkDue && applyBulk("due", bulkDue)}
                      style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: D.accent, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: bulkDue ? 1 : 0.4 }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FAB */}
          {showFab && (
            <button onClick={openNewTask} aria-label="New task"
              style={{ position: "absolute", bottom: "calc(80px + env(safe-area-inset-bottom))", right: 24, width: 52, height: 52, borderRadius: "50%", background: D.accent, border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 12px ${D.accentShadow}`, zIndex: 10 }}>
              <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="13" y1="3" x2="13" y2="23" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <line x1="3" y1="13" x2="23" y2="13" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* BOTTOM NAV */}
          <div style={{ display: "flex", borderTop: `0.5px solid ${D.border}`, height: "calc(60px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", flexShrink: 0 }}>
            {[["inbox", "Inbox", Tray], ["today", "Today", CalendarDot], ["tomorrow", "Tomorrow", CalendarPlus], ["all", "All", SquaresFour], ["gmail", "Mail", Envelope]].map(([id, label, Icon]) => {
              const active = view === id;
              return (
                <button key={id} onClick={() => navTo(id)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 12, fontWeight: active ? 500 : 400, color: active ? D.accent : D.textMuted, cursor: "pointer", border: "none", background: "transparent", padding: "4px 2px", transition: "all .15s", position: "relative" }}>
                  {id === "inbox" && inboxCount > 0 && (
                    <span style={{ position: "absolute", top: 6, right: "calc(50% - 20px)", background: D.danger, color: "white", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "1px 5px", lineHeight: 1.4 }}>{inboxCount}</span>
                  )}
                  <Icon size={26} weight="light" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* TASK DRAWER */}
          <TaskDrawer
            open={drawer.open}
            onClose={closeDrawer}
            initialTask={drawer.task ? { ...drawer.task, ...drawer.prefill } : (Object.keys(drawer.prefill || {}).length ? { ...drawer.prefill } : null)}
            onSave={saveTask}
            onDelete={removeTask}
            clients={clients}
            projects={projects}
            filterTags={filterTags}
            statuses={statuses}
            forceCtx={drawer.forceCtx}
          />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
