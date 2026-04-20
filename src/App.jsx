import { useState, useEffect, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "";

const CATS = [
  { id: "food",          label: "🍽️ Comida",        color: "#FF6B6B" },
  { id: "transport",     label: "🚗 Transporte",     color: "#4ECDC4" },
  { id: "entertainment", label: "🎬 Entrete.",       color: "#FFE66D" },
  { id: "health",        label: "💊 Salud",          color: "#95E1D3" },
  { id: "shopping",      label: "🛍️ Compras",        color: "#F38181" },
  { id: "services",      label: "📱 Servicios",      color: "#A8D8EA" },
  { id: "education",     label: "📚 Educación",      color: "#AA96DA" },
  { id: "other",         label: "📦 Otro",           color: "#C7F2A4" },
];

const ACCS = [
  { id: "credit",  label: "💳 Crédito", color: "#6b6bff" },
  { id: "savings", label: "🏦 Ahorros", color: "#4ade80" },
  { id: "both",    label: "⚡ Ambas",   color: "#facc15" },
];

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmt   = v  => "$" + Number(Math.round(v || 0)).toLocaleString("es-CO");
const getCM = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const getML = k  => { if (!k) return ""; const [y,m] = k.split("-"); return `${MONTHS[parseInt(m)-1]} ${y}`; };
const today = () => new Date().toISOString().split("T")[0];
const addM  = (ym, n) => { let [y,m] = ym.split("-").map(Number); m += n; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return `${y}-${String(m).padStart(2,"0")}`; };
const mDiff = (a, b) => { const [ay,am] = a.split("-").map(Number), [by,bm] = b.split("-").map(Number); return (by-ay)*12+(bm-am); };

// ─── API hook ─────────────────────────────────────────────────────────────
function useAPI() {
  const token = localStorage.getItem("fin_token");
  return useCallback(async (method, path, body) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) { localStorage.removeItem("fin_token"); window.location.href = "/"; return; }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, [token]);
}

// ─── Push setup ───────────────────────────────────────────────────────────
async function setupPush(api) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const { key } = await api("GET", "/api/push/vapid-key");
    if (!key) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await api("POST", "/api/push/subscribe", sub.toJSON());
  } catch (e) { console.warn("Push setup:", e.message); }
}

// ─── CSS ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#090910;font-family:'DM Sans',sans-serif;}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2a2a40;border-radius:2px}
  .tab{cursor:pointer;padding:6px 10px;border-radius:16px;font-size:15px;transition:all .18s;border:none;background:transparent;color:#555;}
  .tab.active{background:#e8e4dc;color:#090910;}
  .tab:hover:not(.active){background:#1e1e2a;color:#e8e4dc;}
  .mtab{cursor:pointer;padding:5px 11px;border-radius:16px;font-size:11px;border:none;background:transparent;color:#555;white-space:nowrap;transition:all .18s;}
  .mtab.active{background:#e8e4dc;color:#090910;font-weight:600;}
  .mtab:hover:not(.active){color:#e8e4dc;background:#1e1e2a;}
  .card{background:#11111a;border:1px solid #1e1e2c;border-radius:16px;padding:18px;}
  .inp{background:#181824;border:1px solid #1e1e2c;border-radius:10px;padding:9px 13px;color:#e8e4dc;font-size:14px;width:100%;outline:none;font-family:'DM Sans',sans-serif;transition:border .18s;}
  .inp:focus{border-color:#6b6bff;}
  textarea.inp{resize:vertical;min-height:80px;font-size:13px;line-height:1.6;}
  select.inp{appearance:none;}
  .btn{cursor:pointer;border:none;border-radius:10px;padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;transition:all .18s;}
  .bp{background:#6b6bff;color:#fff;}.bp:hover{background:#5a5aee;transform:translateY(-1px);}
  .bg{background:#181824;color:#aaa;border:1px solid #1e1e2c;}.bg:hover{color:#e8e4dc;}
  .bai{background:linear-gradient(135deg,#a855f7,#6b6bff);color:#fff;}.bai:hover{opacity:.9;}
  .bsm{padding:6px 12px;font-size:12px;}
  .bdel{background:transparent;border:none;color:#2a2a3a;cursor:pointer;padding:3px 7px;font-size:13px;transition:color .15s;}
  .bdel:hover{color:#f87171;}
  .row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #181824;animation:fi .25s ease;}
  .row:last-child{border-bottom:none;}
  @keyframes fi{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  .toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#e8e4dc;color:#090910;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;animation:su .25s ease;box-shadow:0 4px 24px rgba(0,0,0,.6);white-space:nowrap;}
  .toast.err{background:#ff4455;color:#fff;}
  @keyframes su{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  .seg{display:flex;background:#11111a;border:1px solid #1e1e2c;border-radius:10px;padding:3px;gap:3px;}
  .segtab{flex:1;cursor:pointer;border:none;border-radius:7px;padding:7px 4px;font-size:12px;font-weight:500;background:transparent;color:#555;transition:all .15s;}
  .segtab.active{background:#1e1e2c;color:#e8e4dc;}
  .chip{display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;}
  .pulse{animation:pu 1.4s ease-in-out infinite;}
  @keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}
  .stat{font-family:'Playfair Display',serif;font-weight:700;}
  .lbl{font-size:10px;color:#444;text-transform:uppercase;letter-spacing:.8px;}
  .bar{background:#06060e;border-radius:99px;overflow:hidden;}
  .ar{background:#2a0e10;border:1px solid #5a1a1e;border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.5;margin-bottom:10px;}
  .ay{background:#1e1a08;border:1px solid #4a3e00;border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.5;margin-bottom:10px;}
  .qbtn{cursor:pointer;background:#181824;border:1px solid #1e1e2c;border-radius:10px;padding:10px 12px;font-size:12px;color:#aaa;text-align:left;transition:all .15s;width:100%;}
  .qbtn:hover{border-color:#6b6bff;color:#e8e4dc;}
  .badge{background:#ff4455;color:#fff;border-radius:99px;font-size:9px;padding:1px 5px;font-weight:700;margin-left:4px;}
  .sim-ok{background:#0a1e0e;border:1px solid #1e3a1e;border-radius:12px;padding:16px;margin-top:10px;}
  .sim-bad{background:#2a0e10;border:1px solid #5a1a1e;border-radius:12px;padding:16px;margin-top:10px;}
`;

// ─── App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]           = useState(localStorage.getItem("fin_token"));
  const [user, setUser]             = useState(null);
  const [settings, setSettings]     = useState(null);
  const [txs, setTxs]               = useState([]);
  const [insts, setInsts]           = useState([]);
  const [pending, setPending]       = useState([]);
  const [recurring, setRecurring]   = useState([]);
  const [comparison, setComparison] = useState([]);
  const [view, setView]             = useState("dashboard");
  const [month, setMonth]           = useState(getCM());
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [advice, setAdvice]         = useState("");
  const [adviceLoad, setAdviceLoad] = useState(false);
  const [adviceQ, setAdviceQ]       = useState("");
  const [simForm, setSimForm]       = useState({ name: "", amount: "", months: 12, interestRate: 0 });
  const [simResult, setSimResult]   = useState(null);
  const [simLoad, setSimLoad]       = useState(false);
  const [txForm, setTxForm]         = useState({ name: "", amount: "", category: "food", account: "credit", type: "expense", date: today() });
  const [instForm, setInstForm]     = useState({ name: "", total_amount: "", months: 3, interest_rate: 0, category: "shopping", account: "credit", start_month: getCM() });
  const [txTab, setTxTab]           = useState("single");
  const [settingsForm, setSettingsForm] = useState({});
  const [budgetIn, setBudgetIn]     = useState({});
  const [pendingAns, setPendingAns] = useState({});

  const api    = useAPI();
  const showT  = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };

  // Handle token from OAuth redirect
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("token");
    if (t) { localStorage.setItem("fin_token", t); setToken(t); window.history.replaceState({}, "", "/app"); }
    if (p.get("error")) showT("Error de autenticación: " + p.get("error"), "err");
  }, []);

  // Handle view from URL params (e.g. push notification redirect)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("view");
    if (v) setView(v);
  }, []);

  // Load all data
  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [me, t, i, pen, comp] = await Promise.all([
        api("GET", "/api/me"),
        api("GET", "/api/transactions"),
        api("GET", "/api/installments"),
        api("GET", "/api/pending"),
        api("GET", "/api/comparison"),
      ]);
      setUser(me);
      setSettings(me.settings);
      setSettingsForm({ ...me.settings, budgets: me.settings.budgets || {} });
      setTxs(t || []);
      setInsts(i || []);
      setPending(pen || []);
      setComparison(comp || []);
      api("GET", "/api/recurring").then(r => setRecurring(r || [])).catch(() => {});
    } catch (e) {
      if (!e.message?.includes("401")) showT("Error cargando datos", "err");
    }
    setLoading(false);
  }, [token, api]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (token && user) setupPush(api).catch(() => {}); }, [token, user]);

  // ── Derived values ──────────────────────────────────────────────────────
  const S     = settings || {};
  const mTxs  = txs.filter(t => t.date?.startsWith(month));

  const instChargeForMonth = useCallback(mo => insts.reduce((sum, inst) => {
    const el = mDiff(inst.start_month, mo);
    if (el >= 0 && el < inst.months) {
      const r = inst.interest_rate / 100;
      return sum + (r > 0 ? inst.total_amount * r * Math.pow(1+r, inst.months) / (Math.pow(1+r, inst.months)-1) : inst.total_amount / inst.months);
    }
    return sum;
  }, 0), [insts]);

  const instCurrent  = instChargeForMonth(month);
  const cExpTx       = mTxs.filter(t => t.type === "expense" && (t.account === "credit" || t.account === "both")).reduce((s, t) => s + t.amount, 0);
  const cExpTotal    = cExpTx + instCurrent;
  const cPct         = S.credit_limit > 0 ? Math.min((cExpTotal / S.credit_limit) * 100, 100) : 0;
  const cAvail       = S.credit_limit - cExpTotal;
  const cColor       = cPct < 60 ? "#4ade80" : cPct < 85 ? "#facc15" : "#f87171";
  const allSavInc    = txs.filter(t => t.type === "income"  && (t.account === "savings" || t.account === "both")).reduce((s, t) => s + t.amount, 0);
  const allSavExp    = txs.filter(t => t.type === "expense" && (t.account === "savings" || t.account === "both")).reduce((s, t) => s + t.amount, 0);
  const savBal       = (S.savings_balance || 0) + allSavInc - allSavExp;
  const savGoalPct   = S.savings_goal > 0 ? Math.min((savBal / S.savings_goal) * 100, 100) : 0;
  const mSavInc      = mTxs.filter(t => t.type === "income"  && (t.account === "savings" || t.account === "both")).reduce((s, t) => s + t.amount, 0);
  const mSavExp      = mTxs.filter(t => t.type === "expense" && (t.account === "savings" || t.account === "both")).reduce((s, t) => s + t.amount, 0);
  const totalInt     = insts.reduce((sum, i) => { if (i.interest_rate <= 0) return sum; const r = i.interest_rate/100; const m = i.total_amount*r*Math.pow(1+r,i.months)/(Math.pow(1+r,i.months)-1); return sum+(m*i.months-i.total_amount); }, 0);
  const freeIncome   = (S.monthly_income || 0) - cExpTotal - mSavExp;
  const byCat        = {}; CATS.forEach(c => { byCat[c.id] = 0; }); mTxs.filter(t => t.type === "expense").forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const prevMonths   = [...new Set(txs.map(t => t.date?.slice(0, 7)).filter(Boolean))].sort().reverse().slice(0, 6);
  const projs        = [0,1,2].map(n => { const mo = addM(getCM(), n); return { mo, label: getML(mo), charge: instChargeForMonth(mo) }; });
  const activeInsts  = insts.filter(i => mDiff(i.start_month, getCM()) >= 0 && mDiff(i.start_month, getCM()) < i.months);
  const dom          = new Date().getDate();
  const cutDay       = S.cut_day || 25;
  const payDay       = S.pay_day || 10;
  const daysToCut    = cutDay >= dom ? cutDay - dom : cutDay + 30 - dom;
  const daysToPayDay = payDay >= dom ? payDay - dom : payDay + 30 - dom;

  // ── Actions ─────────────────────────────────────────────────────────────
  const addTx = async () => {
    const amount = parseInt(String(txForm.amount).replace(/\D/g, ""));
    if (!txForm.name.trim() || !amount) { showT("Completa los campos", "err"); return; }
    await api("POST", "/api/transactions", { ...txForm, amount });
    setTxForm({ name: "", amount: "", category: "food", account: "credit", type: "expense", date: today() });
    await load(); showT("Registrado ✓");
  };

  const addInst = async () => {
    const total = parseInt(String(instForm.total_amount).replace(/\D/g, ""));
    if (!instForm.name.trim() || !total) { showT("Completa los campos", "err"); return; }
    await api("POST", "/api/installments", { ...instForm, total_amount: total, months: parseInt(instForm.months), interest_rate: parseFloat(instForm.interest_rate) || 0 });
    setInstForm({ name: "", total_amount: "", months: 3, interest_rate: 0, category: "shopping", account: "credit", start_month: getCM() });
    await load(); showT("Cuotas registradas ✓");
  };

  const delTx        = async id => { await api("DELETE", `/api/transactions/${id}`); await load(); showT("Eliminado"); };
  const delInst      = async id => { await api("DELETE", `/api/installments/${id}`); await load(); showT("Eliminado"); };
  const answerPending = async p => {
    const a = pendingAns[p.id] || {};
    if (!a.months) { showT("Indica el número de cuotas", "err"); return; }
    await api("POST", `/api/pending/${p.id}/answer`, a);
    await load(); showT("Registrado ✓");
  };
  const saveSettings = async () => {
    const budgets = { ...(S.budgets || {}) };
    Object.entries(budgetIn).forEach(([k, v]) => { const n = parseInt(v?.replace(/\D/g, "")); if (n) budgets[k] = n; });
    await api("PUT", "/api/settings", { ...settingsForm, budgets });
    await load(); showT("Configuración guardada ✓");
  };
  const doSync = async () => {
    setSyncing(true);
    try { await api("POST", "/api/sync"); } catch {}
    setTimeout(async () => { await load(); setSyncing(false); showT("Sync completo ✓"); }, 9000);
  };
  const askAdvisor = async q2 => {
    setAdviceLoad(true); setAdvice("");
    try { const r = await api("POST", "/api/advisor", { question: q2 || adviceQ }); setAdvice(r.advice); }
    catch (e) { setAdvice("Error conectando: " + e.message); }
    setAdviceLoad(false);
  };
  const simulate = async () => {
    const amount = parseInt(String(simForm.amount).replace(/\D/g, ""));
    if (!simForm.name || !amount) { showT("Completa el simulador", "err"); return; }
    setSimLoad(true); setSimResult(null);
    try { const r = await api("POST", "/api/simulate", { ...simForm, amount, months: parseInt(simForm.months), interestRate: parseFloat(simForm.interestRate) || 0 }); setSimResult(r); }
    catch (e) { showT("Error: " + e.message, "err"); }
    setSimLoad(false);
  };

  // ── Screens ──────────────────────────────────────────────────────────────

  // Login
  if (!token) return (
    <div style={{ background: "#090910", minHeight: "100vh", color: "#e8e4dc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 900, marginBottom: 8 }}>finanzas<span style={{ color: "#6b6bff" }}>.</span></div>
        <div style={{ fontSize: 13, color: "#444", marginBottom: 8, lineHeight: 1.6 }}>Gestión inteligente de tu tarjeta y ahorros</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#555", marginBottom: 28, textAlign: "left", background: "#11111a", border: "1px solid #1e1e2c", borderRadius: 12, padding: 14 }}>
          {["✅ Correos bancarios leídos automáticamente","✅ Cuotas con y sin interés calculadas","✅ Notificaciones push en tu celular","✅ Asesor IA con tus datos reales","✅ Simulador de compras","✅ Gratis"].map(t => <div key={t}>{t}</div>)}
        </div>
        <a href={`${API}/auth/login`} style={{ display: "block", background: "linear-gradient(135deg,#a855f7,#6b6bff)", color: "#fff", padding: "14px 24px", borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 12 }}>
          📧 Conectar con Outlook / Hotmail
        </a>
        <div style={{ fontSize: 11, color: "#333" }}>🔒 OAuth seguro — nunca guardamos tu contraseña</div>
      </div>
    </div>
  );

  // Loading
  if (loading) return (
    <div style={{ background: "#090910", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div className="pulse" style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#6b6bff" }}>finanzas.</div>
    </div>
  );

  return (
    <div style={{ background: "#090910", minHeight: "100vh", color: "#e8e4dc" }}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ background: "#090910", borderBottom: "1px solid #161620", padding: "11px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 900 }}>finanzas<span style={{ color: "#6b6bff" }}>.</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {pending.length > 0 && <button className="btn bg bsm" style={{ color: "#facc15", borderColor: "#4a3e00" }} onClick={() => setView("pending")}>❓<span className="badge">{pending.length}</span></button>}
          <button className="btn bg bsm" onClick={doSync} disabled={syncing}>{syncing ? <span className="pulse">↻</span> : "↻"}</button>
          <div style={{ display: "flex", gap: 2, background: "#11111a", padding: 3, borderRadius: 18, border: "1px solid #1e1e2c" }}>
            {[["dashboard","📊"],["movimientos","💸"],["cuotas","📋"],["simular","🧮"],["asesor","🧠"],["config","⚙️"]].map(([v, ic]) => (
              <button key={v} className={`tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{ic}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "13px 13px 90px" }}>

        {/* ── PENDING ──────────────────────────────────────────────────── */}
        {view === "pending" && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>❓ Cuotas pendientes</div>
            {pending.length === 0 && <div className="card" style={{ textAlign: "center", color: "#333", padding: "28px 0" }}>Sin preguntas pendientes 🎉</div>}
            {pending.map(p => {
              let d = {};
              try { d = JSON.parse(p.parsed_data); } catch {}
              return (
                <div key={p.id} className="card" style={{ marginBottom: 10, background: "#160d22", borderColor: "#3d2a5e" }}>
                  <div style={{ fontSize: 10, color: "#a855f7", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>📧 Detectado vía correo</div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{fmt(d.amount)} · {d.date}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>N° de cuotas</div><input className="inp" type="number" min="1" max="60" placeholder="Ej: 12" value={pendingAns[p.id]?.months || ""} onChange={e => setPendingAns(a => ({ ...a, [p.id]: { ...a[p.id], months: e.target.value } }))} /></div>
                    <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Interés % m.v.</div><input className="inp" type="number" min="0" step="0.1" placeholder="0" value={pendingAns[p.id]?.interest_rate || ""} onChange={e => setPendingAns(a => ({ ...a, [p.id]: { ...a[p.id], interest_rate: e.target.value } }))} /></div>
                  </div>
                  <button className="btn bp" style={{ width: "100%" }} onClick={() => answerPending(p)}>Registrar</button>
                </div>
              );
            })}
          </>
        )}

        {/* ── DASHBOARD ────────────────────────────────────────────────── */}
        {view === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6 }}>
              <button className={`mtab ${month === getCM() ? "active" : ""}`} onClick={() => setMonth(getCM())}>Este mes</button>
              {prevMonths.filter(m => m !== getCM()).map(m => (
                <button key={m} className={`mtab ${month === m ? "active" : ""}`} onClick={() => setMonth(m)}>{getML(m)}</button>
              ))}
            </div>

            {pending.length > 0 && <div className="ay" style={{ cursor: "pointer" }} onClick={() => setView("pending")}>❓ <strong>{pending.length} compra(s)</strong> esperan información de cuotas — toca para responder</div>}
            {cPct >= 85 && <div className="ar">🚨 <strong>Cupo al {cPct.toFixed(0)}%</strong> — Solo {fmt(cAvail)} disponibles</div>}
            {cPct >= 60 && cPct < 85 && <div className="ay">⚠️ Llevas el {cPct.toFixed(0)}% del cupo. Modera los gastos.</div>}
            {S.monthly_income > 0 && cExpTotal > S.monthly_income * 0.3 && <div className="ay">💡 El gasto en crédito supera el 30% de tu nómina</div>}
            {daysToCut <= 3 && <div className="ay">✂️ Fecha de corte en <strong>{daysToCut} día(s)</strong> — saldo: {fmt(cExpTotal)}</div>}
            {daysToPayDay <= 3 && daysToPayDay > 0 && <div className="ar">⏰ Fecha de pago en <strong>{daysToPayDay} día(s)</strong> — total: {fmt(cExpTotal)}</div>}

            {/* Credit card */}
            <div className="card" style={{ marginBottom: 10, background: "linear-gradient(135deg,#11111a,#18182e)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -45, right: -45, width: 140, height: 140, borderRadius: "50%", background: "rgba(107,107,255,.06)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div className="lbl">💳 Tarjeta Crédito</div>
                  <div className="stat" style={{ fontSize: 26, color: cColor, marginTop: 2 }}>{fmt(cExpTotal)}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>de {fmt(S.credit_limit)} · corte día {cutDay}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="lbl">Disponible</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: cAvail < 0 ? "#f87171" : "#4ade80", marginTop: 2 }}>{fmt(Math.abs(cAvail))}</div>
                  {instCurrent > 0 && <div style={{ fontSize: 11, color: "#6b6bff", marginTop: 2 }}>{fmt(instCurrent)} cuotas</div>}
                </div>
              </div>
              <div className="bar" style={{ height: 6, marginBottom: 4 }}><div style={{ height: "100%", width: `${cPct}%`, background: `linear-gradient(90deg,#6b6bff,${cColor})`, borderRadius: 99, transition: "width 1.1s" }} /></div>
              <div style={{ fontSize: 11, color: "#444" }}>{cPct.toFixed(0)}% · {activeInsts.length} cuotas activas · pago día {payDay}</div>
            </div>

            {/* Savings */}
            <div className="card" style={{ marginBottom: 10, background: "linear-gradient(135deg,#0c1a0c,#11221a)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: S.savings_goal > 0 ? 10 : 0 }}>
                <div>
                  <div className="lbl">🏦 Cuenta Ahorros</div>
                  <div className="stat" style={{ fontSize: 26, color: "#4ade80", marginTop: 2 }}>{fmt(savBal)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#2a5a2a", marginBottom: 4 }}>Este mes</div>
                  <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>+{fmt(mSavInc)}</div>
                  <div style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>-{fmt(mSavExp)}</div>
                </div>
              </div>
              {S.savings_goal > 0 && <>
                <div style={{ fontSize: 12, color: "#2a5a2a", marginBottom: 5 }}>{S.savings_goal_name}: {savGoalPct.toFixed(0)}% · faltan {fmt(Math.max(0, S.savings_goal - savBal))}</div>
                <div className="bar" style={{ height: 5 }}><div style={{ height: "100%", width: `${savGoalPct}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 99, transition: "width 1.1s" }} /></div>
              </>}
            </div>

            {/* Balance */}
            {S.monthly_income > 0 && (
              <div className="card" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Balance del mes</div>
                {[["💰 Nómina", S.monthly_income, "#4ade80", 100], ["💳 Crédito", cExpTotal, "#6b6bff", (cExpTotal / S.monthly_income) * 100], ["🏦 Débito", mSavExp, "#4ECDC4", (mSavExp / S.monthly_income) * 100]].map(([l, v, c, p]) => (
                  <div key={l} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: "#aaa" }}>{l}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(v)}</span></div>
                    <div className="bar" style={{ height: 4 }}><div style={{ height: "100%", width: `${Math.min(p || 0, 100)}%`, background: c, borderRadius: 99, transition: "width 1s" }} /></div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #1e1e2c", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#555" }}>Estimado libre</span>
                  <span style={{ fontWeight: 700, color: freeIncome >= 0 ? "#4ade80" : "#f87171" }}>{fmt(freeIncome)}</span>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Gastos por categoría</div>
              {CATS.filter(c => byCat[c.id] > 0).length === 0 && <div style={{ color: "#333", fontSize: 13, textAlign: "center", padding: "10px 0" }}>Sin gastos este mes</div>}
              {CATS.filter(c => byCat[c.id] > 0).sort((a, b) => byCat[b.id] - byCat[a.id]).map(cat => {
                const amt = byCat[cat.id], budget = (S.budgets || {})[cat.id];
                return (
                  <div key={cat.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12 }}>{cat.label}</span>
                      <div><span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(amt)}</span>{budget && <span style={{ fontSize: 10, color: amt > budget ? "#f87171" : "#4ade80", marginLeft: 5 }}>/{fmt(budget)}</span>}</div>
                    </div>
                    <div className="bar" style={{ height: 4 }}><div style={{ height: "100%", width: `${cExpTotal > 0 ? (amt / cExpTotal) * 100 : 0}%`, background: cat.color, borderRadius: 99, transition: "width 1s" }} /></div>
                    {budget && amt > budget && <div style={{ fontSize: 10, color: "#f87171", marginTop: 1 }}>⚠️ Límite superado</div>}
                  </div>
                );
              })}
            </div>

            {/* Comparison */}
            {comparison.length > 1 && (
              <div className="card" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📊 Comparación mensual</div>
                {comparison.map((mc, i) => {
                  const prev = comparison[i + 1]; const diff = prev ? mc.total - prev.total : 0;
                  return (
                    <div key={mc.month} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < comparison.length - 1 ? "1px solid #181824" : "none", fontSize: 13 }}>
                      <span style={{ color: i === 0 ? "#e8e4dc" : "#666" }}>{getML(mc.month)}{i === 0 ? " (actual)" : ""}</span>
                      <div><span style={{ fontWeight: 600 }}>{fmt(mc.total)}</span>{prev && <span style={{ fontSize: 11, color: diff > 0 ? "#f87171" : "#4ade80", marginLeft: 6 }}>{diff > 0 ? "▲" : "▼"}{fmt(Math.abs(diff))}</span>}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recurring */}
            {recurring.length > 0 && (
              <div className="card" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🔄 Suscripciones detectadas</div>
                {recurring.map(r => (
                  <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #181824", fontSize: 13 }}>
                    <span style={{ color: "#aaa" }}>{r.name}</span><span style={{ color: "#facc15", fontWeight: 600 }}>{fmt(r.amount)}/mes</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #1e1e2c", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: "#555" }}>Total suscripciones</span><span style={{ fontWeight: 700, color: "#facc15" }}>{fmt(recurring.reduce((s, r) => s + r.amount, 0))}/mes</span>
                </div>
              </div>
            )}

            {/* Projections */}
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Proyección cuotas</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {projs.map((p, i) => (
                  <div key={p.mo} style={{ background: "#181824", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${i === 0 ? "#6b6bff33" : "#1e1e2c"}` }}>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 4 }}>{p.label}</div>
                    <div className="stat" style={{ fontSize: 13, color: i === 0 ? "#6b6bff" : "#e8e4dc" }}>{fmt(p.charge)}</div>
                    <div style={{ fontSize: 9, color: "#333", marginTop: 2 }}>cuotas</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button className="btn bai" style={{ fontSize: 12 }} onClick={() => { setView("asesor"); askAdvisor(""); }}>🧠 Asesor IA</button>
              <button className="btn bg"  style={{ fontSize: 12 }} onClick={() => setView("simular")}>🧮 Simular compra</button>
            </div>
          </>
        )}

        {/* ── MOVIMIENTOS ──────────────────────────────────────────────── */}
        {view === "movimientos" && (
          <>
            <div style={{ background: "#0a0a14", border: "1px solid #1e1e2c", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 700 }}>🔄 Sync automático cada 5 min</div><div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>Outlook conectado</div></div>
              <button className="btn bg bsm" onClick={doSync} disabled={syncing}>{syncing ? <span className="pulse">↻</span> : "↻ Sync"}</button>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="seg" style={{ marginBottom: 12 }}>
                {[["single","💳 Único"],["installment","📋 Cuotas"]].map(([v, l]) => (
                  <button key={v} className={`segtab ${txTab === v ? "active" : ""}`} onClick={() => setTxTab(v)}>{l}</button>
                ))}
              </div>

              {txTab === "single" && (
                <>
                  <div className="seg" style={{ marginBottom: 10 }}>
                    {[["expense","📉 Gasto"],["income","📈 Ingreso"]].map(([v, l]) => (
                      <button key={v} className={`segtab ${txForm.type === v ? "active" : ""}`} onClick={() => setTxForm(f => ({ ...f, type: v }))}>{l}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input className="inp" placeholder="Descripción" value={txForm.name} onChange={e => setTxForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="inp" placeholder="Monto ($)" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
                    <div className="seg">{ACCS.map(a => <button key={a.id} className={`segtab ${txForm.account === a.id ? "active" : ""}`} onClick={() => setTxForm(f => ({ ...f, account: a.id }))} style={{ fontSize: 11 }}>{a.label}</button>)}</div>
                    {txForm.type === "expense" && <select className="inp" value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>}
                    <input className="inp" type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                    <button className="btn bp" onClick={addTx}>+ Registrar</button>
                  </div>
                </>
              )}

              {txTab === "installment" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input className="inp" placeholder="Nombre (ej: TV Samsung)" value={instForm.name} onChange={e => setInstForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="inp" placeholder="Valor total ($)" value={instForm.total_amount} onChange={e => setInstForm(f => ({ ...f, total_amount: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Cuotas</div><input className="inp" type="number" min="1" max="60" value={instForm.months} onChange={e => setInstForm(f => ({ ...f, months: e.target.value }))} /></div>
                    <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Interés % m.v.</div><input className="inp" type="number" min="0" step="0.1" placeholder="0" value={instForm.interest_rate} onChange={e => setInstForm(f => ({ ...f, interest_rate: e.target.value }))} /></div>
                  </div>
                  <select className="inp" value={instForm.category} onChange={e => setInstForm(f => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                  <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Mes de inicio</div><input className="inp" type="month" value={instForm.start_month} onChange={e => setInstForm(f => ({ ...f, start_month: e.target.value }))} /></div>
                  {instForm.total_amount && (() => {
                    const t = parseInt(String(instForm.total_amount).replace(/\D/g, "")) || 0;
                    const n = parseInt(instForm.months) || 1;
                    const r = parseFloat(instForm.interest_rate) || 0;
                    const m = r > 0 ? t * (r/100) * Math.pow(1+r/100, n) / (Math.pow(1+r/100, n)-1) : t / n;
                    return <div style={{ background: "#181824", border: "1px solid #1e1e2c", borderRadius: 10, padding: 12, fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div><span style={{ color: "#555" }}>Cuota: </span><strong>{fmt(m)}/mes</strong></div>
                      <div><span style={{ color: "#555" }}>Total: </span><strong>{fmt(m * n)}</strong></div>
                      {r > 0 && <div style={{ gridColumn: "1/-1", color: "#f87171" }}>Interés total: {fmt(m * n - t)}</div>}
                    </div>;
                  })()}
                  <button className="btn bp" onClick={addInst}>+ Registrar</button>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700 }}>Movimientos del mes</div>
                <div style={{ fontSize: 11, color: "#444" }}>{mTxs.length}</div>
              </div>
              {mTxs.length === 0 && <div style={{ color: "#333", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Sin movimientos este mes</div>}
              {mTxs.slice(0, 30).map(t => {
                const cat = CATS.find(c => c.id === t.category) || CATS[7];
                const acc = ACCS.find(a => a.id === t.account) || ACCS[0];
                const isInc = t.type === "income";
                return (
                  <div key={t.id} className="row">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: isInc ? "rgba(74,222,128,.1)" : cat.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{isInc ? "📈" : cat.label.split(" ")[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                        {t.from_email === 1 && <span className="chip" style={{ background: "rgba(168,85,247,.15)", color: "#c084fc", flexShrink: 0 }}>auto</span>}
                        {t.is_recurring === 1 && <span className="chip" style={{ background: "rgba(250,204,21,.1)", color: "#facc15", flexShrink: 0 }}>🔄</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{t.date} · <span style={{ color: acc.color }}>{acc.label}</span></div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isInc ? "#4ade80" : "#e8e4dc", flexShrink: 0 }}>{isInc ? "+" : "-"}{fmt(t.amount)}</div>
                    <button className="bdel" onClick={() => delTx(t.id)}>✕</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── CUOTAS ───────────────────────────────────────────────────── */}
        {view === "cuotas" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="lbl">Activas</div><div className="stat" style={{ fontSize: 24, marginTop: 4 }}>{activeInsts.length}</div></div>
              <div className="card" style={{ textAlign: "center", padding: 14 }}><div className="lbl">Cargo mes</div><div className="stat" style={{ fontSize: 20, marginTop: 4, color: "#6b6bff" }}>{fmt(instCurrent)}</div></div>
            </div>
            {totalInt > 0 && <div className="ay" style={{ marginBottom: 10 }}>💡 Pagarás <strong>{fmt(totalInt)}</strong> en intereses con tus cuotas actuales.</div>}
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Compras a cuotas</div>
              {insts.length === 0 && <div style={{ color: "#333", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Sin cuotas registradas</div>}
              {insts.map(inst => {
                const el = Math.max(0, mDiff(inst.start_month, getCM())); const rem = Math.max(0, inst.months - el);
                const r = inst.interest_rate / 100;
                const monthly = r > 0 ? inst.total_amount * r * Math.pow(1+r, inst.months) / (Math.pow(1+r, inst.months)-1) : inst.total_amount / inst.months;
                const interest = monthly * inst.months - inst.total_amount;
                const pct = Math.min((el / inst.months) * 100, 100); const active = rem > 0;
                const cat = CATS.find(c => c.id === inst.category) || CATS[7];
                return (
                  <div key={inst.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #181824" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{cat.label.split(" ")[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{inst.name}</span>
                        <span className="chip" style={{ background: active ? "rgba(107,107,255,.15)" : "rgba(74,222,128,.15)", color: active ? "#6b6bff" : "#4ade80", flexShrink: 0 }}>{active ? `${rem} pend.` : "Lista ✓"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>{fmt(monthly)}/mes · {el}/{inst.months}{inst.interest_rate > 0 && <span style={{ color: "#f87171", marginLeft: 5 }}>+{fmt(interest)} interés</span>}</div>
                      <div style={{ height: 3, background: "#06060e", borderRadius: 99, overflow: "hidden", marginTop: 4 }}><div style={{ height: "100%", width: `${pct}%`, background: active ? "#6b6bff" : "#4ade80", borderRadius: 99 }} /></div>
                    </div>
                    <button className="bdel" onClick={() => delInst(inst.id)}>✕</button>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Proyección 6 meses</div>
              {[0,1,2,3,4,5].map(n => {
                const mo = addM(getCM(), n); const ch = instChargeForMonth(mo);
                const maxC = Math.max(...[0,1,2,3,4,5].map(x => instChargeForMonth(addM(getCM(), x))), 1);
                return (
                  <div key={mo} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, color: n === 0 ? "#6b6bff" : "#aaa" }}>{getML(mo)}{n === 0 ? " ←" : ""}</span><span style={{ fontSize: 12, fontWeight: 600, color: n === 0 ? "#6b6bff" : "#e8e4dc" }}>{fmt(ch)}</span></div>
                    <div className="bar" style={{ height: 5 }}><div style={{ height: "100%", width: `${(ch / maxC) * 100}%`, background: n === 0 ? "#6b6bff" : "#2a2a50", borderRadius: 99, transition: "width 1s" }} /></div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── SIMULADOR ────────────────────────────────────────────────── */}
        {view === "simular" && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧮 Simulador de compras</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 14 }}>Antes de comprar, descubre si puedes permitírtelo.</div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="inp" placeholder="¿Qué quieres comprar? (ej: iPhone 15)" value={simForm.name} onChange={e => setSimForm(f => ({ ...f, name: e.target.value }))} />
                <input className="inp" placeholder="Precio ($)" value={simForm.amount} onChange={e => setSimForm(f => ({ ...f, amount: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Cuotas</div><input className="inp" type="number" min="1" max="60" value={simForm.months} onChange={e => setSimForm(f => ({ ...f, months: e.target.value }))} /></div>
                  <div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Interés % m.v.</div><input className="inp" type="number" min="0" step="0.1" placeholder="0" value={simForm.interestRate} onChange={e => setSimForm(f => ({ ...f, interestRate: e.target.value }))} /></div>
                </div>
                <button className="btn bai" onClick={simulate} disabled={simLoad}>{simLoad ? <span className="pulse">Analizando...</span> : "Simular con IA →"}</button>
              </div>
            </div>
            {simResult && (
              <div className={simResult.canAfford ? "sim-ok" : "sim-bad"}>
                <div style={{ fontSize: 10, color: simResult.canAfford ? "#4ade80" : "#f87171", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>{simResult.canAfford ? "✓ Factible con cuidado" : "⚠️ Riesgo financiero"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[["Cuota mensual", fmt(simResult.monthly)], ["Total a pagar", fmt(simResult.totalPay)], ["Interés total", fmt(simResult.totalInterest)], ["Nuevo uso cupo", `${simResult.newCreditPct?.toFixed(0)}%`]].map(([l, v]) => (
                    <div key={l}><div style={{ fontSize: 10, color: "#444", marginBottom: 1 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div></div>
                  ))}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#ccc", whiteSpace: "pre-wrap" }}>{simResult.analysis}</div>
              </div>
            )}
          </>
        )}

        {/* ── ASESOR ───────────────────────────────────────────────────── */}
        {view === "asesor" && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🧠 Asesor Financiero IA</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 14 }}>Consejos basados en tus datos reales.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {["¿Cuánto puedo gastar esta semana?","¿Me conviene pagar de contado o a cuotas?","¿Cómo llego más rápido a mi meta de ahorro?","¿En qué categoría estoy gastando de más?"].map(q2 => (
                <button key={q2} className="qbtn" onClick={() => { setAdviceQ(q2); askAdvisor(q2); }}>{q2}</button>
              ))}
            </div>
            <div className="card" style={{ marginBottom: 12 }}>
              <textarea className="inp" style={{ minHeight: 70 }} placeholder="Escribe tu pregunta..." value={adviceQ} onChange={e => setAdviceQ(e.target.value)} />
              <button className="btn bai" style={{ width: "100%", marginTop: 8 }} onClick={() => askAdvisor(adviceQ)} disabled={adviceLoad}>{adviceLoad ? <span className="pulse">🧠 Analizando...</span> : "Preguntar →"}</button>
            </div>
            {advice && (
              <div className="card">
                <div style={{ fontSize: 10, color: "#6b6bff", fontWeight: 600, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>Análisis personalizado</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#ccc", whiteSpace: "pre-wrap" }}>{advice}</div>
                <button className="btn bg bsm" style={{ marginTop: 12, width: "100%" }} onClick={() => { setAdvice(""); setAdviceQ(""); }}>Nueva consulta</button>
              </div>
            )}
          </>
        )}

        {/* ── CONFIG ───────────────────────────────────────────────────── */}
        {view === "config" && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>⚙️ Configuración</div>
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Datos financieros</div>
              {[["💳 Cupo tarjeta","credit_limit"],["🏦 Saldo inicial ahorros","savings_balance"],["💰 Ingreso mensual","monthly_income"],["🎯 Meta de ahorro","savings_goal"]].map(([l, k]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>{l}</label>
                  <input className="inp" value={settingsForm[k] || ""} onChange={e => setSettingsForm(f => ({ ...f, [k]: parseInt(e.target.value.replace(/\D/g, "")) || 0 }))} placeholder="$0" />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>Nombre de la meta</label>
                <input className="inp" value={settingsForm.savings_goal_name || ""} onChange={e => setSettingsForm(f => ({ ...f, savings_goal_name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>✂️ Día de corte</label><input className="inp" type="number" min="1" max="31" value={settingsForm.cut_day || 25} onChange={e => setSettingsForm(f => ({ ...f, cut_day: parseInt(e.target.value) || 25 }))} /></div>
                <div><label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>💳 Día de pago</label><input className="inp" type="number" min="1" max="31" value={settingsForm.pay_day || 10} onChange={e => setSettingsForm(f => ({ ...f, pay_day: parseInt(e.target.value) || 10 }))} /></div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>📧 Palabras clave correos (separadas por coma)</label>
                <input className="inp" value={settingsForm.email_filter || ""} onChange={e => setSettingsForm(f => ({ ...f, email_filter: e.target.value }))} placeholder="banco,transaccion,compra..." />
              </div>
            </div>
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Límites por categoría</div>
              {CATS.map(cat => (
                <div key={cat.id} style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 3 }}>{cat.label}</label>
                  <input className="inp" placeholder={(S.budgets || {})[cat.id] ? fmt((S.budgets || {})[cat.id]) : "Sin límite"} value={budgetIn[cat.id] || ""} onChange={e => setBudgetIn(b => ({ ...b, [cat.id]: e.target.value }))} />
                </div>
              ))}
            </div>
            <button className="btn bp" style={{ width: "100%", marginBottom: 10 }} onClick={saveSettings}>Guardar configuración</button>
            <div className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Cuenta conectada</div>
              <div style={{ fontSize: 13, color: "#888" }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>✓ Outlook conectado · Sync cada 5 min</div>
            </div>
            <button className="btn bg" style={{ width: "100%", color: "#f87171", borderColor: "#3a1a1e", fontSize: 12 }} onClick={() => { localStorage.removeItem("fin_token"); window.location.href = "/"; }}>Cerrar sesión</button>
          </>
        )}

      </div>

      {toast && <div className={`toast ${toast.type === "err" ? "err" : ""}`}>{toast.msg}</div>}
    </div>
  );
}
