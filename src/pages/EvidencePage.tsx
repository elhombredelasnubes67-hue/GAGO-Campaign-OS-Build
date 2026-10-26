// GAGO CAMPAIGN OS — Evidencias comerciales
import { useState } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { Evidence, EvidenceType, EvidenceStatus } from '../lib/types';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

function emptyEvidence(orgId: string, userId: string): Evidence {
  return {
    id: generateId(), organizationId: orgId, title: '', claim: '',
    sourceType: 'other', reference: '', date: '', excerpt: '',
    responsible: '', status: 'pending', limitations: '', expiryDate: null,
    linkedProducts: [], linkedCampaigns: [], linkedCreatives: [],
    createdAt: now(), updatedAt: now(), createdBy: userId
  };
}

const typeLabels: Record<EvidenceType, string> = {
  study: 'Estudio', testimonial: 'Testimonio', data: 'Dato',
  certification: 'Certificación', other: 'Otro'
};
const statusLabels: Record<EvidenceStatus, string> = {
  pending: 'Pendiente', reviewed: 'Revisada', rejected: 'Rechazada', expired: 'Caducada'
};
const statusColors: Record<EvidenceStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-slate-100 text-slate-500'
};

export default function EvidencePage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const [editing, setEditing] = useState<Evidence | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = state.evidence.filter(e =>
    filterStatus === 'all' || e.status === filterStatus
  );

  const handleNew = () => {
    if (!state.user) return;
    setEditing(emptyEvidence(state.organization.id, state.user.id));
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = (e: Evidence) => {
    setEditing({ ...e });
    setShowForm(true);
    setFormError('');
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.title.trim()) { setFormError('El título es obligatorio.'); return; }
    if (!editing.claim.trim()) { setFormError('La afirmación es obligatoria.'); return; }

    const updated = { ...editing, updatedAt: now() };
    const existing = state.evidence.find(e => e.id === updated.id);

    if (existing) {
      dispatch({ type: 'UPDATE_EVIDENCE', payload: updated });
      addAuditEvent('Evidencia actualizada', 'evidence', updated.id, updated.title);
    } else {
      dispatch({ type: 'ADD_EVIDENCE', payload: updated });
      addAuditEvent('Evidencia creada', 'evidence', updated.id, updated.title);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta evidencia?')) return;
    dispatch({ type: 'DELETE_EVIDENCE', payload: id });
    addAuditEvent('Evidencia eliminada', 'evidence', id, '');
  };

  // Detect quantitative claims without backing
  const unbackedClaims = state.evidence.filter(e =>
    e.status === 'pending' && /\d+\s*(%|por ciento|porcentaje|ahorro|mejora|rendimiento)/i.test(e.claim)
  );

  if (showForm && editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {state.evidence.find(e => e.id === editing.id) ? 'Editar evidencia' : 'Nueva evidencia'}
          </h1>
          <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de fuente</label>
              <select value={editing.sourceType} onChange={e => setEditing({ ...editing, sourceType: e.target.value as EvidenceType })}
                className="input">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Afirmación respaldada *</label>
            <textarea value={editing.claim} onChange={e => setEditing({ ...editing, claim: e.target.value })}
              className="input" rows={2} placeholder="¿Qué afirmación respalda esta evidencia?" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL o referencia</label>
              <input value={editing.reference} onChange={e => setEditing({ ...editing, reference: e.target.value })}
                className="input" placeholder="https://... o referencia documental" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}
                className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Extracto o explicación</label>
            <textarea value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
              className="input" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <input value={editing.responsible} onChange={e => setEditing({ ...editing, responsible: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as EvidenceStatus })}
                className="input">
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de caducidad</label>
              <input type="date" value={editing.expiryDate || ''} onChange={e => setEditing({ ...editing, expiryDate: e.target.value || null })}
                className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Limitaciones</label>
            <textarea value={editing.limitations} onChange={e => setEditing({ ...editing, limitations: e.target.value })}
              className="input" rows={2} placeholder="Limitaciones conocidas de esta evidencia" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Productos vinculados</label>
              <select multiple value={editing.linkedProducts}
                onChange={e => setEditing({ ...editing, linkedProducts: Array.from(e.target.selectedOptions, o => o.value) })}
                className="input h-24">
                {state.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campañas vinculadas</label>
              <select multiple value={editing.linkedCampaigns}
                onChange={e => setEditing({ ...editing, linkedCampaigns: Array.from(e.target.selectedOptions, o => o.value) })}
                className="input h-24">
                {state.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anuncios vinculados</label>
              <select multiple value={editing.linkedCreatives}
                onChange={e => setEditing({ ...editing, linkedCreatives: Array.from(e.target.selectedOptions, o => o.value) })}
                className="input h-24">
                {state.creatives.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
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
          <h1 className="text-2xl font-bold text-slate-800">Evidencias comerciales</h1>
          <p className="text-sm text-slate-500">{filtered.length} evidencias</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="all">Todos los estados</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
            <Plus size={16} /> Nueva
          </button>
        </div>
      </div>

      {unbackedClaims.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Afirmaciones cuantitativas pendientes de respaldo</p>
            <p className="text-xs text-amber-700 mt-1">
              {unbackedClaims.map(e => e.title).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 text-xs text-slate-500">
        «Revisada» significa revisión interna registrada. No significa certificación, conformidad jurídica ni verificación independiente.
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay evidencias registradas.</p>
          <button onClick={handleNew} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            Registrar primera evidencia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-slate-800">{e.title}</h3>
                  <p className="text-xs text-slate-400">{typeLabels[e.sourceType]} · {e.date || 'Sin fecha'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status]}`}>
                  {statusLabels[e.status]}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{e.claim}</p>
              {e.excerpt && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{e.excerpt}</p>}
              {e.limitations && <p className="text-xs text-amber-600 mb-2">Limitaciones: {e.limitations}</p>}
              {e.expiryDate && new Date(e.expiryDate) < new Date() && (
                <p className="text-xs text-red-500 mb-2">⚠ Caducada el {e.expiryDate}</p>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(e)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>
                <div className="flex-1" />
                <span className="text-xs text-slate-400">
                  {e.linkedProducts.length} productos · {e.linkedCampaigns.length} campañas · {e.linkedCreatives.length} anuncios
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
