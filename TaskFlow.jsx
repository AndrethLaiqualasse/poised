import { useState, useRef, useEffect } from "react";

// Load Tabler icons from CDN
if (typeof document !== "undefined" && !document.getElementById("tabler-icons-css")) {
  const link = document.createElement("link");
  link.id = "tabler-icons-css";
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.19.0/tabler-icons.min.css";
  document.head.appendChild(link);
}

const TODAY = "2026-05-07";
const TOMORROW = "2026-05-08";
const PRIORITY_LABELS = { p1: "High", p2: "Medium", p3: "Low", p4: "None" };

const D = {
  bg: "#2e3446",
  bgSurface: "#363d52",
  bgRaised: "#3f4760",
  bgHover: "#48526e",
  border: "rgba(180,195,225,0.1)",
  borderMed: "rgba(180,195,225,0.2)",
  text: "#e8edf6",
  textMuted: "#a0b2cc",
  textFaint: "#5e7294",
  accent: "#8ba4cc",
  accentBg: "rgba(139,164,204,0.15)",
  accentMuted: "rgba(139,164,204,0.25)",
  danger: "#f87171",
  dangerBorder: "rgba(248,113,113,0.3)",
  success: "#34d399",
};
const PRIORITY_STYLES = {
  p1: { background: "transparent", color: "#f87171" },
  p2: { background: "transparent", color: "#94afd4" },
  p3: { background: "transparent", color: "#4d6a93" },
  p4: { background: "transparent", color: "#3d5070" },
};
const STATUS_STYLES = {
  "Not Started": { background: "transparent", color: "#4d6a93" },
  Working: { background: "transparent", color: "#94afd4" },
  Waiting: { background: "transparent", color: "#c4a55a" },
  Complete: { background: "transparent", color: "#34d399" },
  Deferred: { background: "transparent", color: "#3d5070" },
};

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

const SEED_TASKS = [
  { id: 1, sub: "OnceHub Integration — demo ready", desc: "Verify end-to-end flow.", ctx: "business", pri: "p1", status: "Working", due: TODAY, inbox: false, done: false, doneAt: null, recur: "none", client: "Kora", proj: "OnceHub Launch", tags: [], reminder: false, remdt: null, order: 0 },
  { id: 2, sub: "MailChimp Hourly Stats — timeline change", desc: "", ctx: "business", pri: "p2", status: "Not Started", due: TOMORROW, inbox: false, done: false, doneAt: null, recur: "none", client: "Kora", proj: null, tags: [], reminder: false, remdt: null, order: 1 },
  { id: 3, sub: "Add Activity / Open Activities list views", desc: "Contact and Orgs.", ctx: "business", pri: "p2", status: "Not Started", due: TOMORROW, inbox: false, done: false, doneAt: null, recur: "none", client: "Kora", proj: "Kora CRM Setup", tags: [], reminder: false, remdt: null, order: 2 },
  { id: 4, sub: "MailChimp Distro Open — tab or migrate?", desc: "", ctx: "business", pri: "p2", status: "Waiting", due: TOMORROW, inbox: false, done: false, doneAt: null, recur: "none", client: "Kora", proj: "Kora CRM Setup", tags: ["Waiting on"], reminder: false, remdt: null, order: 3 },
  { id: 5, sub: "Confirm how DocSend Tasks are created", desc: "", ctx: "business", pri: "p2", status: "Not Started", due: TOMORROW, inbox: false, done: false, doneAt: null, recur: "none", client: "Kora", proj: null, tags: ["5 min task"], reminder: false, remdt: null, order: 4 },
  { id: 6, sub: "Start \"last contact\" solution", desc: "Begin scoping.", ctx: "business", pri: "p3", status: "Not Started", due: null, inbox: true, done: false, doneAt: null, recur: "none", client: "Badgley Phelps", proj: null, tags: [], reminder: false, remdt: null, order: 5 },
  { id: 7, sub: "Review Q2 personal budget", desc: "", ctx: "personal", pri: "p2", status: "Not Started", due: null, inbox: true, done: false, doneAt: null, recur: "none", client: null, proj: null, tags: [], reminder: false, remdt: null, order: 6 },
  { id: 8, sub: "Schedule dentist appointment", desc: "", ctx: "personal", pri: "p3", status: "Not Started", due: null, inbox: true, done: false, doneAt: null, recur: "none", client: null, proj: null, tags: ["5 min task"], reminder: false, remdt: null, order: 7 },
  { id: 9, sub: "Send Q1 report to Kora", desc: "", ctx: "business", pri: "p2", status: "Complete", due: "2026-05-06", inbox: false, done: true, doneAt: "2026-05-06", recur: "none", client: "Kora", proj: "Kora CRM Setup", tags: [], reminder: false, remdt: null, order: 8 },
];

const SEED_PROJECTS = [
  { name: "OnceHub Launch", ctx: "business", client: "Kora" },
  { name: "Kora CRM Setup", ctx: "business", client: "Kora" },
  { name: "Home Renovation", ctx: "personal", client: null },
];

const EMPTY_FILTERS = { pri: "all", status: "all", date: "all", tag: "all" };
const EMPTY_SORT = "manual";

const Chip = ({ children, style }) => (
  <span style={{ fontSize: 12, padding: "1px 7px", borderRadius: 20, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3, ...style }}>{children}</span>
);

// ── FILTER DROPDOWN ──────────────────────────────────────────────────────
function FilterDropdown({ filters, setFilters, filterTags, statuses, extraGroups = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const activeCount = Object.entries(filters).filter(([k, v]) => v !== "all").length;
  const groups = [
    { key: "pri", label: "Priority", opts: [["all", "Any"], ["p1", "High"], ["p2", "Medium"], ["p3", "Low"]] },
    { key: "status", label: "Status", opts: [["all", "Any"], ...statuses.map(s => [s, s])] },
    { key: "date", label: "Date", opts: [["all", "Any"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["this-week", "This week"], ["next-week", "Next week"], ["this-month", "This month"], ["next-month", "Next month"]] },
    ...extraGroups,
    { key: "tag", label: "Tags", opts: [["all", "Any tag"], ...filterTags.map(t => [t, "#" + t])] },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Filters"
        style={{ background: "none", border: "none", cursor: "pointer", color: activeCount > 0 ? D.accent : D.textMuted, padding: "4px 6px", display: "flex", alignItems: "center", gap: 3, position: "relative" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                {g.opts.map(([val, label]) => (
                  <span key={val} onClick={() => setFilters(f => ({ ...f, [g.key]: val }))}
                    style={{ fontSize: 13, padding: "3px 9px", borderRadius: 20, border: `0.5px solid ${filters[g.key] === val ? D.accent : D.border}`, cursor: "pointer", background: filters[g.key] === val ? D.accentBg : "transparent", color: filters[g.key] === val ? D.accent : D.textMuted, whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                ))}
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              {sort === val && ✓}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TaskRow({ task, onDone, onEdit, draggable, onDragStart, onDragOver, onDrop }) {
  const due = task.due ? fmtDue(task.due) : null;
  return (
    <div
      onClick={() => !task.done && onEdit(task)}
      style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", borderBottom: `0.5px solid ${D.border}`, background: D.bg, cursor: task.done ? "default" : "pointer", opacity: task.done ? 0.5 : 1 }}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? e => e.preventDefault() : undefined}
      onDrop={draggable ? onDrop : undefined}
    >
      <div
        onClick={e => { e.stopPropagation(); onDone(task.id); }}
        style={{ width: 20, height: 20, borderRadius: "50%", border: task.done ? "none" : `1.5px solid ${D.borderMed}`, background: task.done ? D.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer", transition: "all .15s" }}
      >
        {task.done && ✓}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: task.done ? D.textFaint : D.text, textDecoration: task.done ? "line-through" : "none", marginBottom: 3, lineHeight: 1.35 }}>{task.sub}</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
          <Chip style={STATUS_STYLES[task.status] || STATUS_STYLES["Not Started"]}>{task.status}</Chip>
          <Chip style={PRIORITY_STYLES[task.pri]}>{PRIORITY_LABELS[task.pri]}</Chip>
          {task.ctx === "business" && task.client && <Chip style={{ background: "rgba(56,139,253,0.15)", color: "#79c0ff" }}>{task.client}</Chip>}
          {due && <span style={{ fontSize: 12, color: due.ov ? "#f87171" : D.textMuted, display: "inline-flex", alignItems: "center", gap: 2 }}> {due.l}</span>}
        </div>
      </div>
      {task.done && (
        <button onClick={e => { e.stopPropagation(); onDone(task.id, true); }} style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", color: D.textMuted, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Undo</button>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, padding: "7px 13px 3px", background: D.bgSurface, borderBottom: `0.5px solid ${D.border}`, letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</div>;
}

// ── TASK DRAWER ──────────────────────────────────────────────────────────
function TaskDrawer({ open, onClose, initialTask, onSave, onDelete, clients, projects, filterTags, statuses, forceCtx }) {
  const isEdit = !!initialTask;
  const defaultCtx = forceCtx || (isEdit ? initialTask.ctx : "personal");

  const [form, setForm] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [ctx, setCtx] = useState(defaultCtx);

  useEffect(() => {
    if (open) {
      const base = initialTask || {};
      setCtx(forceCtx || base.ctx || "personal");
      setForm({
        sub: base.sub || "",
        desc: base.desc || "",
        pri: base.pri || "p2",
        status: base.status || "Not Started",
        due: base.due || "",
        client: base.client || "",
        proj: base.proj || "",
        recur: base.recur || "none",
        reminder: base.reminder || false,
        remdt: base.remdt || "",
      });
      setSelectedTags(base.tags || []);
    }
  }, [open, initialTask, forceCtx]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = t => setSelectedTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  // when project changes, auto-fill client from project config
  const handleProjChange = (projName, projectsList) => {
    set("proj", projName);
    const proj = projectsList.find(p => p.name === projName);
    if (proj && proj.client) set("client", proj.client);
  };

  const handleSave = () => {
    if (!form.sub.trim()) return;
    const due = form.due || null;
    onSave({ ...form, ctx, tags: selectedTags, due, inbox: !due, client: ctx === "personal" ? null : form.client || null });
  };

  if (!open) return null;

  const inp = { width: "100%", fontSize: 15, padding: "7px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bgRaised, color: D.text, boxSizing: "border-box" };
  const lbl = { fontSize: 13, fontWeight: 500, color: D.textMuted, marginBottom: 3, display: "block" };
  const row = { marginBottom: 11 };
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 };
  const isPersonal = ctx === "personal";
  const availableProjects = projects.filter(p => p.ctx === ctx);

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: D.bgSurface, borderRadius: "16px 16px 0 0", maxHeight: "92%", display: "flex", flexDirection: "column", border: `0.5px solid ${D.borderMed}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: D.bgHover, margin: "9px auto 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: D.text }}>{isEdit ? "Edit task" : "New task"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMuted, display: "flex", alignItems: "center" }}>
            ✕
          </button>
        </div>

        {!forceCtx && !isEdit && (
          <div style={{ display: "flex", borderBottom: `0.5px solid ${D.border}`, margin: "8px 13px 0" }}>
            {["personal", "business"].map(c => (
              <button key={c} onClick={() => setCtx(c)}
                style={{ flex: 1, padding: "8px 4px", fontSize: 15, fontWeight: 500, background: "none", border: "none", borderBottom: ctx === c ? `2px solid ${D.accent}` : "2px solid transparent", color: ctx === c ? D.accent : D.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                {c === "personal" ? "Personal" : "Business"}
              </button>
            ))}
          </div>
        )}
        {(forceCtx || isEdit) && (
          <div style={{ padding: "6px 13px 0" }}>
            <Chip style={ctx === "business" ? { background: D.accentBg, color: D.accent } : { background: "rgba(167,139,250,0.12)", color: "#c4b5fd" }}>
              {ctx === "business" ? "Business" : "Personal"}
            </Chip>
          </div>
        )}

        <div style={{ overflowY: "auto", padding: 13, flex: 1 }}>
          <div style={row}><label style={lbl}>Subject *</label><input style={inp} value={form.sub} onChange={e => set("sub", e.target.value)} placeholder="What needs to be done?" /></div>
          <div style={row}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 52, resize: "vertical" }} value={form.desc} onChange={e => set("desc", e.target.value)} placeholder="Notes…" /></div>
          <div style={grid}>
            <div style={row}><label style={lbl}>Priority</label>
              <select style={inp} value={form.pri} onChange={e => set("pri", e.target.value)}>
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
              <select style={inp} value={form.proj || ""} onChange={e => handleProjChange(e.target.value, projects)}>
                <option value="">— none —</option>
                {availableProjects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {!isPersonal && (
            <div style={row}><label style={lbl}>Client</label>
              <select style={inp} value={form.client || ""} onChange={e => set("client", e.target.value)}>
                <option value="">— none —</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
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
            <select style={inp} value={form.recur} onChange={e => set("recur", e.target.value)}>
              {["none", "daily", "weekly", "monthly", "yearly"].map(r => <option key={r} value={r}>{r === "none" ? "Not recurring" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            {form.recur !== "none" && <p style={{ fontSize: 13, color: D.textFaint, marginTop: 4 }}>Next recurrence creates only after this one is completed.</p>}
          </div>
          <div style={row}>
            <label style={lbl}>Reminder</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <div onClick={() => set("reminder", !form.reminder)} style={{ width: 36, height: 20, borderRadius: 20, background: form.reminder ? D.accent : D.bgHover, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", width: 16, height: 16, borderRadius: "50%", background: "white", top: 2, left: form.reminder ? 18 : 2, transition: "left .2s" }} />
              </div>
              <span style={{ fontSize: 14, color: D.textMuted }}>{form.reminder ? "On" : "Off"}</span>
              {form.reminder && <input type="datetime-local" style={{ ...inp, flex: 1 }} value={form.remdt} onChange={e => set("remdt", e.target.value)} />}
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

// ── MAIN APP ─────────────────────────────────────────────────────────────
export default function TaskFlow() {
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [nextId, setNextId] = useState(10);
  const [view, setView] = useState("inbox");
  const [globalCtx, setGlobalCtx] = useState("personal"); // top-of-screen context switcher
  const [currentClient, setCurrentClient] = useState("");
  const [currentProj, setCurrentProj] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawer, setDrawer] = useState({ open: false, task: null, forceCtx: null, prefill: {} });
  // sticky filters/sort per context key — "business" and "personal" are independent
  const [contextFilters, setContextFilters] = useState({ business: { ...EMPTY_FILTERS }, personal: { ...EMPTY_FILTERS } });
  const [contextSort, setContextSort] = useState({ business: EMPTY_SORT, personal: EMPTY_SORT });
  const [filters, setFiltersRaw] = useState({ ...EMPTY_FILTERS });
  const [sort, setSortRaw] = useState(EMPTY_SORT);

  // which context key is active for sticky purposes
  function ctxKey() { return globalCtx; }

  function setFilters(f) {
    setFiltersRaw(f);
    setContextFilters(cf => ({ ...cf, [globalCtx]: f }));
  }
  function setSort(s) {
    setSortRaw(s);
    setContextSort(cs => ({ ...cs, [globalCtx]: s }));
  }
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(4);
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [calDayTasks, setCalDayTasks] = useState([]);
  const [calDayLabel, setCalDayLabel] = useState("");
  const [calFilters, setCalFilters] = useState({ ...EMPTY_FILTERS });
  const dragSrc = useRef(null);

  const [clients, setClients] = useState(["Kora", "Badgley Phelps"]);
  const [projects, setProjects] = useState(SEED_PROJECTS);
  const [taskTypes, setTaskTypes] = useState(["Phone Call", "Research", "Shopping", "Admin", "Other"]);
  const [filterTags, setFilterTags] = useState(["5 min task", "Online Shopping", "Waiting on", "Quick win"]);
  const [statuses, setStatuses] = useState(["Not Started", "Working", "Waiting", "Complete", "Deferred"]);
  const [gmailAccounts, setGmailAccounts] = useState([
    { email: "you@gmail.com", ctx: "personal" },
    { email: "work@gmail.com", ctx: "business" },
  ]);
  const [newGmailForm, setNewGmailForm] = useState({ email: "", ctx: "personal" });
  const [newInputs, setNewInputs] = useState({});
  const [newProjForm, setNewProjForm] = useState({ name: "", ctx: "business", client: "" });
  const [accordionOpen, setAccordionOpen] = useState({ views: true, clients: false, projects: false, tags: false });
  const [currentTag, setCurrentTag] = useState("");

  const gmailThreads = [
    { id: "g1", account: "work@gmail.com", sender: "Sarah @ Kora", subject: "RE: MailChimp distro follow up", time: "9:41 AM", unread: true },
    { id: "g2", account: "work@gmail.com", sender: "Mike Donovan", subject: "DocSend access issues — ASAP", time: "Yesterday", unread: true },
    { id: "g3", account: "work@gmail.com", sender: "Badgley Phelps", subject: "Last contact tracking thoughts", time: "Tuesday", unread: false },
    { id: "g4", account: "work@gmail.com", sender: "noreply@oncehub.com", subject: "OnceHub integration ready", time: "Monday", unread: false },
    { id: "g5", account: "you@gmail.com", sender: "Mom", subject: "Dinner this Sunday?", time: "10:02 AM", unread: true },
    { id: "g6", account: "you@gmail.com", sender: "Netflix", subject: "New arrivals this week", time: "Yesterday", unread: false },
  ];

  const inboxCount = tasks.filter(t => !t.done && t.inbox).length;

  // ── filter helpers ──
  function applyFilters(list, f, s) {
    if (f.pri !== "all") list = list.filter(t => t.pri === f.pri);
    if (f.status !== "all") list = list.filter(t => t.status === f.status);
    if (f.tag !== "all") list = list.filter(t => (t.tags || []).includes(f.tag));
    if (f.date === "today") list = list.filter(t => t.due === TODAY);
    else if (f.date === "tomorrow") list = list.filter(t => t.due === TOMORROW);
    else if (f.date === "this-week") { const r = weekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "next-week") { const r = nextWeekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "this-month") { const r = monthRange(0); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (f.date === "next-month") { const r = monthRange(1); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    const sortKey = s !== undefined ? s : sort;
    if (sortKey === "pri") { const o = { p1: 0, p2: 1, p3: 2, p4: 3 }; list = [...list].sort((a, b) => (o[a.pri] || 3) - (o[b.pri] || 3)); }
    else if (sortKey === "due") list = [...list].sort((a, b) => (a.due || "9999") > (b.due || "9999") ? 1 : -1);
    else if (sortKey === "status") list = [...list].sort((a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status));
    return list;
  }

  // ── determine forceCtx for FAB ──
  function getForceCtx() {
    if (view === "client") return "business";
    if (view === "project") {
      const proj = projects.find(p => p.name === currentProj);
      return proj ? proj.ctx : globalCtx;
    }
    return globalCtx; // always use global context switcher
  }

  // ── determine prefill for FAB ──
  function getPrefill() {
    const p = {};
    if (view === "client") p.client = currentClient;
    if (view === "project") {
      p.proj = currentProj;
      const proj = projects.find(pr => pr.name === currentProj);
      if (proj?.client) p.client = proj.client;
    }
    return p;
  }

  function openNewTask() {
    const forceCtx = getForceCtx();
    const prefill = getPrefill();
    setDrawer({ open: true, task: null, forceCtx, prefill });
  }

  function openEdit(task) {
    setDrawer({ open: true, task, forceCtx: task.ctx, prefill: {} });
  }

  function closeDrawer() { setDrawer(d => ({ ...d, open: false })); }

  function saveTask(form) {
    const isEdit = !!drawer.task;
    const prefill = drawer.prefill || {};
    const merged = { ...prefill, ...form };
    const task = { ...merged, id: isEdit ? drawer.task.id : nextId, done: false, doneAt: null, order: isEdit ? drawer.task.order : tasks.length };
    if (isEdit) setTasks(ts => ts.map(t => t.id === task.id ? task : t));
    else { setTasks(ts => [...ts, task]); setNextId(n => n + 1); }
    closeDrawer();
  }

  function deleteTask() {
    setTasks(ts => ts.filter(t => t.id !== drawer.task.id));
    closeDrawer();
  }

  function toggleDone(id, undo = false) {
    setTasks(ts => {
      if (undo) return ts.map(t => t.id === id ? { ...t, done: false, doneAt: null, status: "Not Started" } : t);
      const updated = ts.map(t => t.id === id ? { ...t, done: true, doneAt: TODAY, status: "Complete" } : t);
      const t = ts.find(t => t.id === id);
      if (t && t.recur && t.recur !== "none") return [...updated, { ...t, id: nextId, done: false, doneAt: null, status: "Not Started", order: ts.length }];
      return updated;
    });
    if (!undo) setNextId(n => n + 1);
  }

  function navToTag(tag) {
    setCurrentTag(tag); setView("tag-view"); setMenuOpen(false);
    setFiltersRaw({ ...EMPTY_FILTERS }); setSortRaw(EMPTY_SORT);
  }

  function navTo(v, client = "", proj = "") {
    setView(v); setCurrentClient(client); setCurrentProj(proj); setMenuOpen(false);
    // always restore sticky filters for current globalCtx
    setFiltersRaw(contextFilters[globalCtx] || { ...EMPTY_FILTERS });
    setSortRaw(contextSort[globalCtx] || EMPTY_SORT);
  }

  function switchCtxGlobal(ctx) {
    setGlobalCtx(ctx);
    // restore sticky filters for the new context
    setFiltersRaw(contextFilters[ctx] || { ...EMPTY_FILTERS });
    setSortRaw(contextSort[ctx] || EMPTY_SORT);
  }

  function getTaskList() {
    let list = tasks.filter(t => !t.done);
    if (view === "inbox") list = list.filter(t => t.inbox);
    else if (view === "today") list = list.filter(t => t.due === TODAY);
    else if (view === "tomorrow") list = list.filter(t => t.due === TOMORROW);
    else if (view === "business") list = list.filter(t => t.ctx === "business");
    else if (view === "personal") list = list.filter(t => t.ctx === "personal");
    else if (view === "client") list = list.filter(t => t.client === currentClient);
    else if (view === "tag-view") list = list.filter(t => (t.tags || []).includes(currentTag));
    else if (view === "week") { const r = weekRange(); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (view === "month") { const r = monthRange(0); list = list.filter(t => inRange(t.due, r.start, r.end)); }
    else if (view === "all") list = applyFilters(list, filters);
    return list;
  }

  const VIEWS_WITH_FILTERS = ["all", "inbox", "today", "tomorrow", "business", "personal", "client-view", "week", "month", "tag-view"];
  const showFab = !["settings", "gmail"].includes(view);
  const showFilters = VIEWS_WITH_FILTERS.includes(view);

  const viewTitles = { inbox: "Inbox", today: "Today", tomorrow: "Tomorrow", all: "All tasks", week: "This Week", month: "This Month", cal: "Calendar", completed: "Completed", business: "Business", personal: "Personal", gmail: "Gmail", settings: "Settings", "client-view": currentClient, project: currentProj, "tag-view": `#${currentTag}` };

  // ── render helpers ──
  function renderTaskList(list, draggable = false) {
    if (!list.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing here</div>;
    return list.map(t => (
      <TaskRow key={t.id} task={t} onDone={toggleDone} onEdit={openEdit} draggable={draggable}
        onDragStart={() => { dragSrc.current = t.id; }}
        onDrop={() => {
          if (dragSrc.current === t.id) return;
          setTasks(ts => {
            const arr = [...ts]; const si = arr.findIndex(x => x.id === dragSrc.current); const ti = arr.findIndex(x => x.id === t.id);
            const [m] = arr.splice(si, 1); arr.splice(ti, 0, m); arr.forEach((x, i) => x.order = i); return [...arr];
          });
          dragSrc.current = null;
        }}
      />
    ));
  }

  function renderTomorrow() {
    const list = tasks.filter(t => !t.done && t.due === TOMORROW);
    const filtered = applyFilters(list, filters);
    if (!filtered.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing due tomorrow</div>;
    return [["p1", "High priority"], ["p2", "Medium priority"], ["p3", "Other"]].map(([pri, label]) => {
      const items = filtered.filter(t => pri === "p3" ? ["p3", "p4"].includes(t.pri) : t.pri === pri);
      if (!items.length) return null;
      return <div key={pri}><SectionHeader>{label}</SectionHeader>{renderTaskList(items)}</div>;
    });
  }

  function renderToday() {
    const list = getTaskList();
    if (!list.length) return <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>✓ Nothing due today</div>;
    return [["p1", "High priority"], ["p2", "Medium priority"], ["p3", "Other"]].map(([pri, label]) => {
      const items = list.filter(t => pri === "p3" ? ["p3", "p4"].includes(t.pri) : t.pri === pri);
      if (!items.length) return null;
      return <div key={pri}><SectionHeader>{label}</SectionHeader>{renderTaskList(items)}</div>;
    });
  }

  function renderWeek() {
    const r = weekRange(), names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(r.start + "T00:00:00"); d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10), isToday = ds === TODAY;
      let dayTasks = tasks.filter(t => !t.done && t.due === ds);
      dayTasks = applyFilters(dayTasks, filters);
      return (
        <div key={ds}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (!dragSrc.current) return;
            setTasks(ts => ts.map(t => t.id === dragSrc.current ? { ...t, due: ds, inbox: false } : t));
            dragSrc.current = null;
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? D.accent : D.textMuted, padding: "7px 13px 3px", background: D.bgSurface, borderBottom: `0.5px solid ${D.border}`, display: "flex", justifyContent: "space-between" }}>
            <span>{names[i]} {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{isToday ? " · Today" : ""}</span>
            <span style={{ fontSize: 12, color: D.textFaint }}>{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {dayTasks.length
            ? dayTasks.map(t => (
                <TaskRow key={t.id} task={t} onDone={toggleDone} onEdit={openEdit} draggable
                  onDragStart={() => { dragSrc.current = t.id; }}
                  onDrop={() => {}} // drop handled by day container
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
    let list = tasks.filter(t => !t.done && t.due && inRange(t.due, r.start, r.end));
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
    const pt = tasks.filter(t => t.proj === currentProj);
    const done = pt.filter(t => t.done).length, total = pt.length, pct = total ? Math.round(done / total * 100) : 0;
    const open = pt.filter(t => !t.done), closed = pt.filter(t => t.done);
    const proj = projects.find(p => p.name === currentProj);
    return (
      <div>
        <div style={{ padding: 13, borderBottom: `0.5px solid ${D.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: D.text, marginBottom: 4 }}>{currentProj}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {proj && <Chip style={proj.ctx === "business" ? { background: "#EEEDFE", color: "#534AB7" } : { background: "#FAEEDA", color: "#854F0B" }}>{proj.ctx === "business" ? <> Business</> : <> Personal</>}</Chip>}
            {proj?.client && <Chip style={{ background: "#E6F1FB", color: "#185FA5" }}>{proj.client}</Chip>}
          </div>
          <div style={{ height: 5, background: D.bgHover, borderRadius: 3, margin: "6px 0 4px" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "#1D9E75", width: pct + "%" }} />
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
    const done = tasks.filter(t => t.done);
    const tw = weekRange();
    const grouped = {};
    done.forEach(t => { const k = t.doneAt || "Recently"; if (!grouped[k]) grouped[k] = []; grouped[k].push(t); });
    return (
      <div>
        <div style={{ display: "flex", borderBottom: `0.5px solid ${D.border}` }}>
          {[["Total", done.length], ["This week", done.filter(t => t.doneAt && inRange(t.doneAt, tw.start, tw.end)).length], ["Business", done.filter(t => t.ctx === "business").length]].map(([l, n]) => (
            <div key={l} style={{ flex: 1, textAlign: "center", padding: "11px 6px", borderRight: "0.5px solid #e5e7eb" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: D.text }}>{n}</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {done.length === 0 && <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>No completed tasks yet</div>}
        {Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(k => (
          <div key={k}><SectionHeader>{fmtDoneDate(k)}</SectionHeader>{grouped[k].map(t => <TaskRow key={t.id} task={t} onDone={toggleDone} onEdit={openEdit} />)}</div>
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
        <div key={day} onClick={() => calDayClick(ds)} style={{ fontSize: 14, padding: "6px 2px", cursor: "pointer", borderRadius: 8, textAlign: "center", position: "relative", background: isSel ? "#534AB7" : isToday ? "#EEEDFE" : "transparent", color: isSel ? "white" : isToday ? "#534AB7" : "#374151", fontWeight: isToday || isSel ? 600 : 400 }}>
          {day}
          {hasTasks && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "white" : "#534AB7", margin: "2px auto 0" }} />}
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
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d} style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, padding: "5px 0", textAlign: "center" }}>{d}</div>)}
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
    const ctxAccounts = gmailAccounts.filter(a => a.ctx === globalCtx);
    if (!ctxAccounts.length) {
      return (
        <div style={{ textAlign: "center", padding: 44, color: D.textMuted, fontSize: 15 }}>
          
          No {globalCtx} Gmail accounts linked.<br />
          <span style={{ fontSize: 14 }}>Add one in Settings.</span>
        </div>
      );
    }
    return (
      <div>
        {ctxAccounts.map(acc => {
          const threads = gmailThreads.filter(t => t.account === acc.email);
          return (
            <div key={acc.email}>
              {/* Account header */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", background: globalCtx === "business" ? "#1e1b4b" : "#3b0764", borderBottom: "0.5px solid rgba(255,255,255,0.1)", fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                 {acc.email}
                <Chip style={{ background: "rgba(255,255,255,0.15)", color: "white", marginLeft: "auto" }}>{acc.ctx}</Chip>
              </div>
              {threads.length === 0 && (
                <div style={{ padding: "12px 13px", fontSize: 14, color: D.textFaint }}>No threads</div>
              )}
              {threads.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", borderBottom: `0.5px solid ${D.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: t.unread ? 600 : 500, color: D.text }}>{t.sender}</div>
                    <div style={{ fontSize: 14, color: t.unread ? "#111827" : "#9ca3af", marginTop: 2 }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: D.textFaint, marginTop: 2 }}>{t.time}</div>
                  </div>
                  <button onClick={() => setDrawer({ open: true, task: null, forceCtx: globalCtx, prefill: { desc: "From: " + t.sender } })}
                    style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", cursor: "pointer" }}>+ Task</button>
                </div>
              ))}
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
      { label: "Clients", key: "cl", list: clients, setList: setClients },
    ];
    return (
      <div>
        {strSections.map(s => (
          <div key={s.key} style={{ padding: 13, borderBottom: `0.5px solid ${D.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>{s.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 7 }}>
              {s.list.map(item => (
                <span key={item} style={{ fontSize: 13, padding: "3px 9px", borderRadius: 20, border: `0.5px solid ${D.borderMed}`, color: D.textMuted, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {item}<span onClick={() => s.setList(l => l.filter(x => x !== item))} style={{ cursor: "pointer" }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newInputs[s.key] || ""} onChange={e => setNewInputs(n => ({ ...n, [s.key]: e.target.value }))} placeholder={`New…`} style={{ flex: 1, fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }} />
              <button onClick={() => { const v = (newInputs[s.key] || "").trim(); if (v && !s.list.includes(v)) { s.setList(l => [...l, v]); setNewInputs(n => ({ ...n, [s.key]: "" })); } }} style={{ fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>
        ))}

        {/* Projects with ctx + client */}
        <div style={{ padding: 13, borderBottom: `0.5px solid ${D.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>Projects</div>
          {projects.map(p => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: "0.5px solid #f3f4f6", fontSize: 14 }}>
              <span style={{ flex: 1, color: D.text }}>{p.name}</span>
              <Chip style={p.ctx === "business" ? { background: "#EEEDFE", color: "#534AB7" } : { background: "#FAEEDA", color: "#854F0B" }}>{p.ctx}</Chip>
              {p.client && <Chip style={{ background: "#E6F1FB", color: "#185FA5" }}>{p.client}</Chip>}
              <span onClick={() => setProjects(ps => ps.filter(x => x.name !== p.name))} style={{ cursor: "pointer", color: D.textFaint, fontSize: 16 }}>×</span>
            </div>
          ))}
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <input value={newProjForm.name} onChange={e => setNewProjForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" style={{ fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text, gridColumn: "1 / -1" }} />
            <select value={newProjForm.ctx} onChange={e => setNewProjForm(f => ({ ...f, ctx: e.target.value }))} style={{ fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }}>
              <option value="business">Business</option>
              <option value="personal">Personal</option>
            </select>
            <select value={newProjForm.client} onChange={e => setNewProjForm(f => ({ ...f, client: e.target.value }))} style={{ fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }}>
              <option value="">No client</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={() => { const v = newProjForm.name.trim(); if (v && !projects.find(p => p.name === v)) { setProjects(ps => [...ps, { name: v, ctx: newProjForm.ctx, client: newProjForm.client || null }]); setNewProjForm({ name: "", ctx: "business", client: "" }); } }} style={{ marginTop: 7, fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", cursor: "pointer", width: "100%" }}>+ Add project</button>
        </div>

        {/* Gmail accounts */}
        <div style={{ padding: 13 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: D.text, marginBottom: 9 }}>Gmail accounts <span style={{ fontSize: 13, color: D.textMuted, fontWeight: 400 }}>(up to 3)</span></div>
          {gmailAccounts.map(acc => (
            <div key={acc.email} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `0.5px solid ${D.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.email}</div>
              </div>
              <select value={acc.ctx} onChange={e => setGmailAccounts(a => a.map(x => x.email === acc.email ? { ...x, ctx: e.target.value } : x))}
                style={{ fontSize: 13, padding: "3px 6px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }}>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </select>
              <button onClick={() => setGmailAccounts(a => a.filter(x => x.email !== acc.email))}
                style={{ fontSize: 13, padding: "3px 7px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", cursor: "pointer", color: "#ef4444" }}>✕</button>
            </div>
          ))}
          {gmailAccounts.length < 3 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={newGmailForm.email} onChange={e => setNewGmailForm(f => ({ ...f, email: e.target.value }))} placeholder="email@gmail.com"
                  style={{ flex: 1, fontSize: 14, padding: "5px 9px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }} />
                <select value={newGmailForm.ctx} onChange={e => setNewGmailForm(f => ({ ...f, ctx: e.target.value }))}
                  style={{ fontSize: 14, padding: "5px 8px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: D.bg, color: D.text }}>
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <button onClick={() => {
                const v = newGmailForm.email.trim();
                if (v && !gmailAccounts.find(a => a.email === v)) {
                  setGmailAccounts(a => [...a, { email: v, ctx: newGmailForm.ctx }]);
                  setNewGmailForm({ email: "", ctx: "personal" });
                }
              }} style={{ fontSize: 14, padding: "5px 10px", borderRadius: 8, border: `0.5px solid ${D.borderMed}`, background: "transparent", cursor: "pointer", width: "100%" }}>+ Add account</button>
            </div>
          )}
          {gmailAccounts.length >= 3 && <p style={{ fontSize: 13, color: D.textMuted, marginTop: 7 }}>Maximum of 3 accounts reached.</p>}
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

  const menuItems = [
    { id: "inbox", icon: "📥", label: "Inbox" },
    { id: "today", icon: "☀️", label: "Today" },
    { id: "tomorrow", icon: "🌅", label: "Tomorrow" },
    { id: "all", icon: "📋", label: "All tasks" },
    { id: "week", icon: "📅", label: "This week" },
    { id: "month", icon: "🗓", label: "This month" },
    { id: "cal", icon: "📆", label: "Calendar" },
    { id: "completed", icon: "✅", label: "Completed" },
  ];

  // ── dark theme tokens defined at module level above ──

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

  return (
    <div style={{ padding: "0.5rem 0" }}>
      <div style={{ display: "flex", flexDirection: "column", height: 844, width: 390, margin: "0 auto", background: D.bg, position: "relative", overflow: "hidden", borderRadius: 16, border: `0.5px solid ${D.border}` }}>

        {/* SIDEBAR OVERLAY */}
        {menuOpen && (
          <div onClick={() => setMenuOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 59 }} />
        )}

        {/* SIDEBAR — constrained inside the container via overflow:hidden on parent */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 260,
          background: D.bgSurface, borderRight: `0.5px solid ${D.borderMed}`,
          zIndex: 60,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s ease",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "16px 14px 10px", borderBottom: `0.5px solid ${D.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: D.text }}>TaskFlow</div>
            <div style={{ fontSize: 13, color: D.textFaint, marginTop: 2 }}>you@gmail.com</div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {/* PINNED */}
            <div style={{ padding: "6px 0 2px" }}>
              {[
                { id: "inbox", label: "Inbox" },
                { id: "today", label: "Today" },
                { id: "tomorrow", label: "Tomorrow" },
              ].map(m => (
                <div key={m.id} onClick={() => navTo(m.id)} style={mItem(view === m.id)}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* MORE VIEWS */}
            <div style={{ borderTop: `0.5px solid ${D.border}` }}>
              <div onClick={() => setAccordionOpen(a => ({ ...a, views: !a.views }))} style={accordHdr}>
                <span>More views</span>
                <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.views ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
              </div>
              {accordionOpen.views && [
                { id: "all", label: "All tasks" },
                { id: "week", label: "This week" },
                { id: "month", label: "This month" },
                { id: "cal", label: "Calendar" },
                { id: "completed", label: "Completed" },
              ].map(m => (
                <div key={m.id} onClick={() => navTo(m.id)} style={mItem(view === m.id)}>
                  {m.label}
                </div>
              ))}
            </div>

            {/* CLIENTS */}
            {globalCtx !== "personal" && (
              <div style={{ borderTop: `0.5px solid ${D.border}` }}>
                <div onClick={() => setAccordionOpen(a => ({ ...a, clients: !a.clients }))} style={accordHdr}>
                  <span>Clients</span>
                  <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.clients ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
                </div>
                {accordionOpen.clients && clients.map(c => (
                  <div key={c} onClick={() => navTo("client", c)} style={mItem(view === "client" && currentClient === c)}>
                     {c}
                  </div>
                ))}
              </div>
            )}

            {/* PROJECTS */}
            <div style={{ borderTop: `0.5px solid ${D.border}` }}>
              <div onClick={() => setAccordionOpen(a => ({ ...a, projects: !a.projects }))} style={accordHdr}>
                <span>Projects</span>
                <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.projects ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
              </div>
              {accordionOpen.projects && projects.map(p => (
                <div key={p.name} onClick={() => navTo("project", "", p.name)} style={mItem(view === "project" && currentProj === p.name)}>
                   {p.name}
                </div>
              ))}
            </div>

            {/* TAGS */}
            <div style={{ borderTop: `0.5px solid ${D.border}` }}>
              <div onClick={() => setAccordionOpen(a => ({ ...a, tags: !a.tags }))} style={accordHdr}>
                <span>Tags</span>
                <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: accordionOpen.tags ? "rotate(90deg)" : "rotate(0deg)", color: D.textFaint }}>›</span>
              </div>
              {accordionOpen.tags && filterTags.map(tag => (
                <div key={tag} onClick={() => navToTag(tag)} style={mItem(view === "tag-view" && currentTag === tag)}>
                   #{tag}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `0.5px solid ${D.border}`, flexShrink: 0 }}>
            <div onClick={() => navTo("gmail")} style={mItem(view === "gmail")}>
               Gmail
            </div>
            <div onClick={() => navTo("settings")} style={mItem(view === "settings")}>
               Settings
            </div>
          </div>
        </div>

        {/* TOPBAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px", height: 48, borderBottom: `0.5px solid ${D.border}`, flexShrink: 0 }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: D.text, display: "flex", alignItems: "center" }}>
            ☰
          </button>
          <h2 style={{ flex: 1, fontSize: 17, fontWeight: 600, color: D.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewTitles[view] || view}</h2>
          {view === "completed" && (
            <button onClick={() => setTasks(ts => ts.filter(t => !t.done))}
              style={{ fontSize: 13, padding: "3px 8px", borderRadius: 8, border: `0.5px solid ${D.dangerBorder}`, background: "transparent", color: D.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
               Clear
            </button>
          )}
          {showFilters && (
            <>
              <SortDropdown sort={sort} setSort={setSort} dark={D} />
              <FilterDropdown filters={filters} setFilters={setFilters} filterTags={filterTags} statuses={statuses} dark={D} />
            </>
          )}
        </div>

        {/* CONTEXT SWITCHER */}
        <div style={{ display: "flex", background: D.bgSurface, borderBottom: `0.5px solid ${D.borderMed}`, flexShrink: 0, padding: "0 12px", gap: 4 }}>
          {[["personal", "Personal"], ["business", "Business"]].map(([ctx, label]) => {
            const active = globalCtx === ctx;
            return (
              <button key={ctx} onClick={() => switchCtxGlobal(ctx)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 8px", border: active ? `0.5px solid ${D.borderMed}` : "0.5px solid transparent", borderBottom: active ? `0.5px solid ${D.bgSurface}` : "0.5px solid transparent", borderRadius: "8px 8px 0 0", marginBottom: -1, cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, background: active ? D.bgRaised : "transparent", color: active ? "#ffffff" : D.textMuted, transition: "all .15s ease" }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {renderMainContent()}
        </div>

        {/* FAB */}
        {showFab && (
          <button onClick={openNewTask} aria-label="New task"
            style={{ position: "absolute", bottom: 64, right: 14, width: 52, height: 52, borderRadius: "50%", background: D.accent, border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 12px rgba(139,164,204,0.35)`, zIndex: 10 }}>
            <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="13" y1="3" x2="13" y2="23" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="3" y1="13" x2="23" y2="13" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* BOTTOM NAV */}
        <div style={{ display: "flex", borderTop: `0.5px solid ${D.border}`, height: 52, flexShrink: 0 }}>
          {[
            ["inbox", "Inbox"],
            ["today", "Today"],
            ["tomorrow", "Tomorrow"],
            ["all", "All"],
          ].map(([id, label]) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => navTo(id)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "#ffffff" : D.textMuted, cursor: "pointer", border: "none", background: "transparent", padding: "4px 2px", transition: "all .15s" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: active ? "5px 14px" : "5px 4px", borderRadius: 20, border: active ? `1px solid ${D.accent}` : "1px solid transparent", background: active ? "rgba(139,164,204,0.25)" : "transparent", transition: "all .15s", position: "relative" }}>
                  {id === "inbox" && inboxCount > 0 && (
                    <span style={{ position: "absolute", top: -6, right: active ? 6 : -8, background: "#f87171", color: "white", fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "1px 5px", lineHeight: 1.4 }}>{inboxCount}</span>
                  )}
                  <span>{label}</span>
                </div>
              </button>
            );
          })}
          <button onClick={() => navTo("gmail")}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 11, fontWeight: view === "gmail" ? 600 : 400, color: view === "gmail" ? "#ffffff" : D.textMuted, cursor: "pointer", border: "none", background: "transparent", padding: "4px 2px", transition: "all .15s" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: view === "gmail" ? "5px 14px" : "5px 4px", borderRadius: 20, border: view === "gmail" ? `1px solid ${D.accent}` : "1px solid transparent", background: view === "gmail" ? "rgba(139,164,204,0.25)" : "transparent", transition: "all .15s" }}>
              <span>Mail</span>
            </div>
          </button>
        </div>

        {/* TASK DRAWER */}
        <TaskDrawer
          open={drawer.open}
          onClose={closeDrawer}
          initialTask={drawer.task ? { ...drawer.task, ...drawer.prefill } : (Object.keys(drawer.prefill || {}).length ? { ...drawer.prefill } : null)}
          onSave={saveTask}
          onDelete={deleteTask}
          clients={clients}
          projects={projects}
          filterTags={filterTags}
          statuses={statuses}
          forceCtx={drawer.forceCtx}
          dark={D}
        />
      </div>
    </div>
  );
}
