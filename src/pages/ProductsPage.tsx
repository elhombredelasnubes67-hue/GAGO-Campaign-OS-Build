// GAGO CAMPAIGN OS — Productos y servicios
import { useState } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { Product } from '../lib/types';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

function emptyProduct(orgId: string, userId: string): Product {
  return {
    id: generateId(),
    organizationId: orgId,
    name: '',
    type: 'product',
    description: '',
    targetAudience: '',
    problemSolved: '',
    valueProposition: '',
    destinationUrl: '',
    priceMinorUnits: null,
    currency: 'EUR',
    responsible: '',
    status: 'draft',
    tags: [],
    evidenceIds: [],
    createdAt: now(),
    updatedAt: now(),
    createdBy: userId
  };
}

function isValidUrl(s: string): boolean {
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

export default function ProductsPage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = state.products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleNew = () => {
    if (!state.user) return;
    setEditing(emptyProduct(state.organization.id, state.user.id));
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = (p: Product) => {
    setEditing({ ...p });
    setShowForm(true);
    setFormError('');
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (editing.destinationUrl && !isValidUrl(editing.destinationUrl)) {
      setFormError('La URL debe ser HTTP o HTTPS válida.'); return;
    }

    const updated = { ...editing, updatedAt: now() };
    const existing = state.products.find(p => p.id === updated.id);

    if (existing) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: updated });
      addAuditEvent('Producto actualizado', 'product', updated.id, updated.name);
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: updated });
      addAuditEvent('Producto creado', 'product', updated.id, updated.name);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Archivar este producto?')) return;
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
    addAuditEvent('Producto eliminado', 'product', id, '');
  };

  if (showForm && editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {state.products.find(p => p.id === editing.id) ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="input" placeholder="Nombre del producto o servicio" />
            </Field>
            <Field label="Tipo">
              <select value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as 'product' | 'service' })}
                className="input">
                <option value="product">Producto</option>
                <option value="service">Servicio</option>
              </select>
            </Field>
          </div>

          <Field label="Descripción">
            <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
              className="input" rows={3} placeholder="Descripción del producto o servicio" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Público destinatario">
              <input value={editing.targetAudience} onChange={e => setEditing({ ...editing, targetAudience: e.target.value })}
                className="input" placeholder="¿A quién va dirigido?" />
            </Field>
            <Field label="Responsable">
              <input value={editing.responsible} onChange={e => setEditing({ ...editing, responsible: e.target.value })}
                className="input" placeholder="Nombre del responsable" />
            </Field>
          </div>

          <Field label="Problema que resuelve">
            <textarea value={editing.problemSolved} onChange={e => setEditing({ ...editing, problemSolved: e.target.value })}
              className="input" rows={2} />
          </Field>

          <Field label="Propuesta de valor">
            <textarea value={editing.valueProposition} onChange={e => setEditing({ ...editing, valueProposition: e.target.value })}
              className="input" rows={2} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="URL de destino">
              <input value={editing.destinationUrl} onChange={e => setEditing({ ...editing, destinationUrl: e.target.value })}
                className="input" placeholder="https://..." />
            </Field>
            <Field label="Precio (céntimos)">
              <input type="number" min="0" value={editing.priceMinorUnits ?? ''}
                onChange={e => setEditing({ ...editing, priceMinorUnits: e.target.value ? parseInt(e.target.value) : null })}
                className="input" placeholder="Ej: 1999 = 19,99 €" />
            </Field>
            <Field label="Moneda">
              <select value={editing.currency} onChange={e => setEditing({ ...editing, currency: e.target.value })}
                className="input">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Estado">
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Product['status'] })}
                className="input">
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </Field>
            <Field label="Etiquetas (separadas por coma)">
              <input value={editing.tags.join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                className="input" placeholder="tag1, tag2" />
            </Field>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
              Guardar
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productos y servicios</h1>
          <p className="text-sm text-slate-500">{filtered.length} registros</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-48"
              placeholder="Buscar..."
            />
          </div>
          <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay productos registrados.</p>
          <button onClick={handleNew} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            Crear primer producto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Precio</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{p.type === 'product' ? 'Producto' : 'Servicio'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.priceMinorUnits != null
                        ? (p.priceMinorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency: p.currency })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400 ml-1" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-green-100 text-green-700',
    archived: 'bg-amber-100 text-amber-700',
  };
  const labels: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    archived: 'Archivado',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}
