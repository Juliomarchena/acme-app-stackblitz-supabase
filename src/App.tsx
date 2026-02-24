// @ts-nocheck
import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONFIGURACIÓN SUPABASE — reemplaza con tus credenciales
// ============================================================
const SUPABASE_URL = "https://tucmdygpbhzuchlvbiou.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Y21keWdwYmh6dWNobHZiaW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDE0ODUsImV4cCI6MjA4NzM3NzQ4NX0.z5I6ZDHA8KDOPt59-uuN1JxQS7C3Qwbk-gGeWSxbjos";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function supaFetch(table, method = "GET", body = null, filter = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  if (method === "DELETE") return [];
  return res.json();
}

// ============================================================
// ESQUEMA DE TABLAS
// ============================================================
const TABLES = {
  oficinas: {
    label: "Oficinas",
    icon: "🏢",
    pk: "oficina",
    fields: [
      { key: "oficina", label: "N° Oficina", type: "number", pk: true },
      { key: "ciudad", label: "Ciudad", type: "text" },
      { key: "region", label: "Región", type: "text" },
      { key: "dir", label: "Director (Empl)", type: "number" },
      { key: "objetivo", label: "Objetivo", type: "number" },
      { key: "ventas", label: "Ventas", type: "number" },
    ],
  },
  repventas: {
    label: "Rep. Ventas",
    icon: "👤",
    pk: "num_empl",
    fields: [
      { key: "num_empl", label: "N° Empleado", type: "number", pk: true },
      { key: "nombre", label: "Nombre", type: "text" },
      { key: "edad", label: "Edad", type: "number" },
      {
        key: "oficina_rep",
        label: "Oficina",
        type: "select",
        rel: { table: "oficinas", value: "oficina", label: "ciudad" },
      },
      { key: "titulo", label: "Título", type: "text" },
      { key: "contrato", label: "Contrato", type: "date" },
      { key: "director", label: "Director (Empl)", type: "number" },
      { key: "cuota", label: "Cuota", type: "number" },
      { key: "ventas", label: "Ventas", type: "number" },
    ],
  },
  clientes: {
    label: "Clientes",
    icon: "🏛️",
    pk: "num_clie",
    fields: [
      { key: "num_clie", label: "N° Cliente", type: "number", pk: true },
      { key: "empresa", label: "Empresa", type: "text" },
      {
        key: "rep_clie",
        label: "Rep. Ventas",
        type: "select",
        rel: { table: "repventas", value: "num_empl", label: "nombre" },
      },
      { key: "limite_credito", label: "Límite Crédito", type: "number" },
    ],
  },
  productos: {
    label: "Productos",
    icon: "📦",
    pk: "id_fab",
    compositePk: ["id_fab", "id_productos"],
    fields: [
      { key: "id_fab", label: "Fabricante", type: "text", pk: true },
      { key: "id_productos", label: "ID Producto", type: "text", pk: true },
      { key: "descripcion", label: "Descripción", type: "text" },
      { key: "precio", label: "Precio", type: "number" },
      { key: "existencias", label: "Existencias", type: "number" },
    ],
  },
  pedidos: {
    label: "Pedidos",
    icon: "📋",
    pk: "num_pedido",
    fields: [
      { key: "num_pedido", label: "N° Pedido", type: "number", pk: true },
      { key: "fecha_pedido", label: "Fecha", type: "date" },
      {
        key: "clie",
        label: "Cliente",
        type: "select",
        rel: { table: "clientes", value: "num_clie", label: "empresa" },
      },
      {
        key: "rep",
        label: "Rep. Ventas",
        type: "select",
        rel: { table: "repventas", value: "num_empl", label: "nombre" },
      },
      { key: "fab", label: "Fabricante", type: "text" },
      { key: "producto", label: "Producto", type: "text" },
      { key: "cant", label: "Cantidad", type: "number" },
      { key: "importe", label: "Importe", type: "number" },
    ],
  },
};

// ============================================================
// ESTILOS
// ============================================================
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0f14;
    --surface: #151820;
    --surface2: #1c2030;
    --border: #2a2f3e;
    --accent: #4f8ef7;
    --accent2: #7c5cfc;
    --success: #34d399;
    --danger: #f87171;
    --warning: #fbbf24;
    --text: #e8eaf2;
    --text-dim: #8891a8;
    --font-head: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    --radius: 12px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
  }

  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  /* SIDEBAR */
  .sidebar {
    width: 220px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }

  .sidebar-logo {
    padding: 28px 20px 20px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-logo h1 {
    font-family: var(--font-head);
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }

  .sidebar-logo p {
    font-size: 0.7rem;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .sidebar-nav {
    padding: 16px 12px;
    flex: 1;
  }

  .nav-label {
    font-size: 0.65rem;
    color: var(--text-dim);
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 0 8px;
    margin-bottom: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.88rem;
    color: var(--text-dim);
    transition: all 0.15s;
    margin-bottom: 2px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active {
    background: linear-gradient(135deg, rgba(79,142,247,0.15), rgba(124,92,252,0.15));
    color: var(--accent);
    font-weight: 500;
    border-left: 2px solid var(--accent);
  }

  .nav-item .icon { font-size: 1.1rem; }
  .nav-count {
    margin-left: auto;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 1px 7px;
    border-radius: 20px;
    font-size: 0.7rem;
    color: var(--text-dim);
  }
  .nav-item.active .nav-count {
    background: rgba(79,142,247,0.2);
    border-color: var(--accent);
    color: var(--accent);
  }

  /* MAIN */
  .main {
    margin-left: 220px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .topbar {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .topbar-title {
    font-family: var(--font-head);
    font-size: 1.3rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .content {
    padding: 28px 32px;
    flex: 1;
  }

  /* BUTTONS */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.15s;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-ghost {
    background: var(--surface2);
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--accent); }
  .btn-danger { background: rgba(248,113,113,0.15); color: var(--danger); border: 1px solid rgba(248,113,113,0.3); }
  .btn-danger:hover { background: rgba(248,113,113,0.25); }
  .btn-success { background: rgba(52,211,153,0.15); color: var(--success); border: 1px solid rgba(52,211,153,0.3); }
  .btn-sm { padding: 5px 10px; font-size: 0.78rem; }

  /* SEARCH */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .search-input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 16px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.88rem;
    outline: none;
    transition: border-color 0.2s;
    max-width: 380px;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--text-dim); }

  /* TABLE */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  table { width: 100%; border-collapse: collapse; }

  thead tr {
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }

  th {
    padding: 12px 16px;
    text-align: left;
    font-family: var(--font-head);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--surface2); }

  td {
    padding: 12px 16px;
    font-size: 0.86rem;
    color: var(--text);
  }

  .td-actions { display: flex; gap: 6px; }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 500;
    background: rgba(79,142,247,0.15);
    color: var(--accent);
    border: 1px solid rgba(79,142,247,0.3);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-dim);
  }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-width: 520px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: slideUp 0.25s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .modal-title {
    font-family: var(--font-head);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .modal-close {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-dim);
    width: 32px; height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.1rem;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .modal-close:hover { color: var(--text); border-color: var(--accent); }

  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .form-control {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 9px 14px;
    color: var(--text);
    font-family: var(--font-body);
    font-size: 0.88rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-control:focus { border-color: var(--accent); }
  .form-control[disabled] { opacity: 0.5; cursor: not-allowed; }

  select.form-control option { background: var(--surface2); }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  /* TOAST */
  .toast-container {
    position: fixed;
    top: 24px; right: 24px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toast {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: var(--shadow);
    animation: slideUp 0.2s ease;
    min-width: 260px;
  }
  .toast.success { border-left: 3px solid var(--success); }
  .toast.error { border-left: 3px solid var(--danger); }

  /* LOADING */
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: var(--text-dim);
    gap: 12px;
  }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* STATS CARDS */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    opacity: 0;
    transition: opacity 0.2s;
  }

  .stat-card:hover::before, .stat-card.active::before { opacity: 1; }
  .stat-card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .stat-card.active { border-color: var(--accent); background: linear-gradient(135deg, rgba(79,142,247,0.08), rgba(124,92,252,0.08)); }

  .stat-icon { font-size: 1.4rem; margin-bottom: 8px; }
  .stat-label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
  .stat-value { font-family: var(--font-head); font-size: 1.6rem; font-weight: 800; color: var(--text); margin-top: 2px; }

  .confirm-dialog {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
    max-width: 380px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: slideUp 0.2s ease;
  }

  .confirm-icon { font-size: 2.5rem; text-align: center; margin-bottom: 12px; }
  .confirm-title { font-family: var(--font-head); font-size: 1.1rem; font-weight: 700; text-align: center; margin-bottom: 8px; }
  .confirm-msg { color: var(--text-dim); font-size: 0.85rem; text-align: center; margin-bottom: 20px; }

  /* PAGINATION */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    font-size: 0.82rem;
    color: var(--text-dim);
  }

  .page-btns { display: flex; gap: 6px; }
  .page-btn {
    width: 32px; height: 32px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-dim);
    cursor: pointer;
    font-size: 0.82rem;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .page-btn:hover { border-color: var(--accent); color: var(--accent); }
  .page-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PAGE_SIZE = 10;

// ============================================================
// HOOKS
// ============================================================
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

function useRelationData(tables) {
  const [relData, setRelData] = useState({});

  useEffect(() => {
    const relTables = new Set();
    Object.values(TABLES).forEach((tbl) => {
      tbl.fields.forEach((f) => {
        if (f.rel) relTables.add(f.rel.table);
      });
    });

    relTables.forEach(async (t) => {
      try {
        const data = await supaFetch(t, "GET", null, "?select=*&limit=500");
        setRelData((prev) => ({ ...prev, [t]: data }));
      } catch (_) {}
    });
  }, []);

  return relData;
}

// ============================================================
// COMPONENTS
// ============================================================

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? "✅" : "❌"} {t.msg}
        </div>
      ))}
    </div>
  );
}

function FormField({ field, value, onChange, relData, isEdit }) {
  const handleChange = (e) => onChange(field.key, e.target.value);

  if (field.type === "select" && field.rel) {
    const options = relData[field.rel.table] || [];
    return (
      <div className="form-group">
        <label className="form-label">{field.label}</label>
        <select className="form-control" value={value ?? ""} onChange={handleChange}>
          <option value="">-- Seleccionar --</option>
          {options.map((opt) => (
            <option key={opt[field.rel.value]} value={opt[field.rel.value]}>
              {opt[field.rel.label]} (#{opt[field.rel.value]})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">{field.label} {field.pk && <span style={{color:"var(--accent)",fontSize:"0.7rem"}}>PK</span>}</label>
      <input
        className="form-control"
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={value ?? ""}
        onChange={handleChange}
        disabled={field.pk && isEdit}
        placeholder={`Ingresa ${field.label.toLowerCase()}`}
      />
    </div>
  );
}

function RecordModal({ tableKey, record, relData, onClose, onSave }) {
  const schema = TABLES[tableKey];
  const isEdit = !!record;
  const [form, setForm] = useState(() => {
    if (isEdit) return { ...record };
    return {};
  });
  const [saving, setSaving] = useState(false);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form, isEdit);
    } finally {
      setSaving(false);
    }
  };

  // group fields into rows of 2 for wider fields
  const fields = schema.fields;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {schema.icon} {isEdit ? "Editar" : "Nuevo"} {schema.label}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div>
          {fields.map((field) => (
            <FormField
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={setField}
              relData={relData}
              isEdit={isEdit}
            />
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "💾 Guardar Cambios" : "✨ Crear Registro"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="confirm-dialog">
        <div className="confirm-icon">🗑️</div>
        <div className="confirm-title">¿Eliminar registro?</div>
        <p className="confirm-msg">Esta acción no se puede deshacer. El registro será eliminado permanentemente.</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

function TableView({ tableKey, relData, toast, counts, setCounts }) {
  const schema = TABLES[tableKey];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { type: 'new'|'edit', record? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supaFetch(tableKey, "GET", null, "?select=*&limit=1000");
      setRows(data);
      setCounts((c) => ({ ...c, [tableKey]: data.length }));
    } catch (e) {
      toast.show("Error al cargar datos: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [tableKey]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = rows.filter((row) =>
    Object.values(row).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getRelLabel = (field, value) => {
    if (!field.rel || !relData[field.rel.table]) return value;
    const found = relData[field.rel.table].find((r) => r[field.rel.value] == value);
    return found ? `${found[field.rel.label]}` : value;
  };

  const handleSave = async (form, isEdit) => {
    try {
      if (isEdit) {
        const pkFields = schema.compositePk || [schema.pk];
        let filter = "?" + pkFields.map((k) => `${k}=eq.${form[k]}`).join("&");
        await supaFetch(tableKey, "PATCH", form, filter);
        toast.show("Registro actualizado correctamente");
      } else {
        await supaFetch(tableKey, "POST", form);
        toast.show("Registro creado correctamente");
      }
      setModal(null);
      fetchData();
    } catch (e) {
      toast.show("Error: " + e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      const pkFields = schema.compositePk || [schema.pk];
      let filter = "?" + pkFields.map((k) => `${k}=eq.${deleteTarget[k]}`).join("&");
      await supaFetch(tableKey, "DELETE", null, filter);
      toast.show("Registro eliminado");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      toast.show("Error al eliminar: " + e.message, "error");
      setDeleteTarget(null);
    }
  };

  const displayFields = schema.fields.slice(0, 5);

  return (
    <div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder={`🔍 Buscar en ${schema.label}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
        <button className="btn btn-primary" onClick={() => setModal({ type: "new" })}>
          + Nuevo
        </button>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading"><div className="spinner" /> Cargando...</div>
        ) : paged.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{schema.icon}</div>
            <p>{search ? "No se encontraron resultados" : "No hay registros aún"}</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  {displayFields.map((f) => <th key={f.key}>{f.label}</th>)}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => {
                  const pkVal = schema.compositePk
                    ? schema.compositePk.map((k) => row[k]).join("-")
                    : row[schema.pk];
                  return (
                    <tr key={pkVal + i}>
                      {displayFields.map((f) => (
                        <td key={f.key}>
                          {f.pk ? (
                            <span className="badge">{row[f.key]}</span>
                          ) : f.rel ? (
                            <span title={`ID: ${row[f.key]}`}>{getRelLabel(f, row[f.key])}</span>
                          ) : (
                            typeof row[f.key] === "number"
                              ? Number(row[f.key]).toLocaleString()
                              : String(row[f.key] ?? "—")
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="td-actions">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setModal({ type: "edit", record: row })}
                          >✏️</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(row)}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="pagination">
                <span>Página {page} de {totalPages}</span>
                <div className="page-btns">
                  <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                  <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                    );
                  })}
                  <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                  <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <RecordModal
          tableKey={tableKey}
          record={modal.record}
          relData={relData}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function AcmeApp() {
  const [activeTable, setActiveTable] = useState("clientes");
  const [counts, setCounts] = useState({});
  const toast = useToast();
  const relData = useRelationData();

  return (
    <>
      <style>{css}</style>
      <Toast toasts={toast.toasts} />

      <div className="app-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>ACME</h1>
            <p>Sistema de Gestión</p>
          </div>
          <nav className="sidebar-nav">
            <p className="nav-label">Tablas</p>
            {Object.entries(TABLES).map(([key, tbl]) => (
              <button
                key={key}
                className={`nav-item ${activeTable === key ? "active" : ""}`}
                onClick={() => setActiveTable(key)}
              >
                <span className="icon">{tbl.icon}</span>
                {tbl.label}
                {counts[key] !== undefined && (
                  <span className="nav-count">{counts[key]}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-title">
              {TABLES[activeTable].icon} {TABLES[activeTable].label}
            </div>
            <div className="topbar-actions" style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
              🔴 Conectado a Supabase
            </div>
          </div>

          {/* STATS CARDS */}
          <div style={{ padding: "20px 32px 0" }}>
            <div className="stats-grid">
              {Object.entries(TABLES).map(([key, tbl]) => (
                <div
                  key={key}
                  className={`stat-card ${activeTable === key ? "active" : ""}`}
                  onClick={() => setActiveTable(key)}
                >
                  <div className="stat-icon">{tbl.icon}</div>
                  <div className="stat-label">{tbl.label}</div>
                  <div className="stat-value">{counts[key] ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="content">
            <TableView
              key={activeTable}
              tableKey={activeTable}
              relData={relData}
              toast={toast}
              counts={counts}
              setCounts={setCounts}
            />
          </div>
        </main>
      </div>
    </>
  );
}
