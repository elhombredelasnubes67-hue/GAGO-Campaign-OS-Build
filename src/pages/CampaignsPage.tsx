// GAGO CAMPAIGN OS — Campañas
import { useState } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { Campaign, CampaignObjective, CampaignChannel, CampaignInternalStatus, CampaignExternalStatus } from '../lib/types';
import { Plus, Search, Edit2, Trash2, Copy, X, Eye } from 'lucide-react';

function emptyCampaign(orgId: string, userId: string): Campaign {
  return {
    id: generateId(), organizationId: orgId, productId: '', name: '',
    objective: 'visibility', description: '', targetAudience: '', channel: 'undetermined',
    territories: '', language: 'es', startDate: '', endDate: '', timezone: 'Europe/Madrid',
    budgetMinorUnits: 0, currency: 'EUR', responsible: '', notes: '',
    internalStatus: 'draft', externalStatus: 'not_registered',
    externalStatusDeclaredBy: null, externalStatusDeclaredAt: null,
    version: 1, createdAt: now(), updatedAt: now(), createdBy: userId
  };
}

const objectiveLabels: Record<CampaignObjective, string> = {
  visibility: 'Visibilidad', traffic: 'Tráfico', leads: 'Solicitudes de información',
  sales: 'Ventas', other: 'Otro'
};
const channelLabels: Record<CampaignChannel, string> = {
  chatgpt_ads: 'ChatGPT Ads', other: 'Otro', undetermined: 'Sin determinar'
};
const internalStatusLabels: Record<CampaignInternalStatus, string> = {
  draft: 'Borrador', in_review: 'En revisión', changes_requested: 'Cambios solicitados',
  approved: 'Aprobado', archived: 'Archivado'
};
const externalStatusLabels: Record<CampaignExternalStatus, string> = {
  not_registered: 'No registrado', ready_to_transfer: 'Preparado para traslado',
  created_externally: 'Creado externamente', paused: 'En pausa',
  publishing: 'En publicación', finished: 'Finalizado'
};

export default function CampaignsPage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = state.campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.internalStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleNew = () => {
    if (!state.user) return;
    setEditing(emptyCampaign(state.organization.id, state.user.id));
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = (c: Campaign) => {
    setEditing({ ...c });
    setShowForm(true);
    setFormError('');
  };

  const handleDuplicate = (c: Campaign) => {
    if (!state.user) return;
    const dup: Campaign = {
      ...c, id: generateId(), name: c.name + ' (copia)',
      internalStatus: 'draft', externalStatus: 'not_registered',
      externalStatusDeclaredBy: null, externalStatusDeclaredAt: null,
      version: 1, createdAt: now(), updatedAt: now(), createdBy: state.user.id
    };
    dispatch({ type: 'ADD_CAMPAIGN', payload: dup });
    addAuditEvent('Campaña duplicada', 'campaign', dup.id, dup.name);
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (!editing.productId) { setFormError('Selecciona un producto.'); return; }

    const existing = state.campaigns.find(c => c.id === editing.id);
    const updated = {
      ...editing, updatedAt: now(),
      version: existing ? existing.version + 1 : 1,
      // Si cambia el estado externo, registrar autor y fecha
      externalStatusDeclaredBy: editing.externalStatus !== existing?.externalStatus ? state.user!.id : editing.externalStatusDeclaredBy,
      externalStatusDeclaredAt: editing.externalStatus !== existing?.externalStatus ? now() : editing.externalStatusDeclaredAt,
    };

    if (existing) {
      dispatch({ type: 'UPDATE_CAMPAIGN', payload: updated });
      addAuditEvent('Campaña actualizada', 'campaign', updated.id, updated.name);
    } else {
      dispatch({ type: 'ADD_CAMPAIGN', payload: updated });
      addAuditEvent('Campaña creada', 'campaign', updated.id, updated.name);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta campaña?')) return;
    dispatch({ type: 'DELETE_CAMPAIGN', payload: id });
    addAuditEvent('Campaña eliminada', 'campaign', id, '');
  };

  const detail = showDetail ? state.campaigns.find(c => c.id === showDetail) : null;
  const detailProduct = detail ? state.products.find(p => p.id === detail.productId) : null;
  const detailCreatives = detail ? state.creatives.filter(c => c.campaignId === detail.id) : [];

  if (showDetail && detail) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{detail.name}</h1>
          <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBlock label="Producto" value={detailProduct?.name || '—'} />
            <InfoBlock label="Objetivo" value={objectiveLabels[detail.objective]} />
            <InfoBlock label="Canal" value={channelLabels[detail.channel]} />
            <InfoBlock label="Estado interno" value={internalStatusLabels[detail.internalStatus]} />
            <InfoBlock label="Estado externo" value={externalStatusLabels[detail.externalStatus]} />
            <InfoBlock label="Presupuesto" value={(detail.budgetMinorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency: detail.currency })} />
            <InfoBlock label="Público" value={detail.targetAudience || '—'} />
            <InfoBlock label="Territorios" value={detail.territories || '—'} />
            <InfoBlock label="Idioma" value={detail.language} />
            <InfoBlock label="Fecha inicio" value={detail.startDate || '—'} />
            <InfoBlock label="Fecha fin" value={detail.endDate || '—'} />
            <InfoBlock label="Responsable" value={detail.responsible || '—'} />
          </div>
          {detail.description && <InfoBlock label="Descripción" value={detail.description} />}
          {detail.notes && <InfoBlock label="Notas" value={detail.notes} />}

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Anuncios asociados ({detailCreatives.length})</h3>
            {detailCreatives.length === 0 ? (
              <p className="text-sm text-slate-400">Sin anuncios registrados.</p>
            ) : (
              <div className="space-y-2">
                {detailCreatives.map(cr => (
                  <div key={cr.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="font-medium text-slate-700">{cr.name}</p>
                    <p className="text-slate-500 text-xs">{cr.headline}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Esta herramienta prepara y registra campañas. La creación, revisión y publicación en una plataforma externa
            se realiza mediante sus canales autorizados.
          </div>
        </div>
      </div>
    );
  }

  if (showForm && editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {state.campaigns.find(c => c.id === editing.id) ? 'Editar campaña' : 'Nueva campaña'}
          </h1>
          <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="input" placeholder="Nombre de la campaña" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Producto *</label>
              <select value={editing.productId} onChange={e => setEditing({ ...editing, productId: e.target.value })}
                className="input">
                <option value="">Seleccionar...</option>
                {state.products.filter(p => p.status !== 'archived').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo</label>
              <select value={editing.objective} onChange={e => setEditing({ ...editing, objective: e.target.value as CampaignObjective })}
                className="input">
                {Object.entries(objectiveLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
              <select value={editing.channel} onChange={e => setEditing({ ...editing, channel: e.target.value as CampaignChannel })}
                className="input">
                {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Idioma</label>
              <input value={editing.language} onChange={e => setEditing({ ...editing, language: e.target.value })}
                className="input" placeholder="es" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}
              className="input" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Público previsto</label>
              <input value={editing.targetAudience} onChange={e => setEditing({ ...editing, targetAudience: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Territorios</label>
              <input value={editing.territories} onChange={e => setEditing({ ...editing, territories: e.target.value })}
                className="input" placeholder="España, Portugal..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio</label>
              <input type="date" value={editing.startDate} onChange={e => setEditing({ ...editing, startDate: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha fin</label>
              <input type="date" value={editing.endDate} onChange={e => setEditing({ ...editing, endDate: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Presupuesto (céntimos)</label>
              <input type="number" min="0" value={editing.budgetMinorUnits || ''}
                onChange={e => setEditing({ ...editing, budgetMinorUnits: parseInt(e.target.value) || 0 })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select value={editing.currency} onChange={e => setEditing({ ...editing, currency: e.target.value })}
                className="input">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado interno</label>
              <select value={editing.internalStatus} onChange={e => setEditing({ ...editing, internalStatus: e.target.value as CampaignInternalStatus })}
                className="input">
                {Object.entries(internalStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado externo (declarado por usuario)</label>
              <select value={editing.externalStatus} onChange={e => setEditing({ ...editing, externalStatus: e.target.value as CampaignExternalStatus })}
                className="input">
                {Object.entries(externalStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <input value={editing.responsible} onChange={e => setEditing({ ...editing, responsible: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zona horaria</label>
              <input value={editing.timezone} onChange={e => setEditing({ ...editing, timezone: e.target.value })}
                className="input" placeholder="Europe/Madrid" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })}
              className="input" rows={2} />
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
          <h1 className="text-2xl font-bold text-slate-800">Campañas</h1>
          <p className="text-sm text-slate-500">{filtered.length} campañas</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm w-48" placeholder="Buscar..." />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="all">Todos los estados</option>
            {Object.entries(internalStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
            <Plus size={16} /> Nueva
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay campañas registradas.</p>
          <button onClick={handleNew} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            Crear primera campaña
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Presupuesto</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const product = state.products.find(p => p.id === c.productId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{product?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.internalStatus === 'approved' ? 'bg-green-100 text-green-700' :
                          c.internalStatus === 'draft' ? 'bg-slate-100 text-slate-600' :
                          c.internalStatus === 'in_review' ? 'bg-blue-100 text-blue-700' :
                          c.internalStatus === 'changes_requested' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {internalStatusLabels[c.internalStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(c.budgetMinorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency: c.currency })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button onClick={() => setShowDetail(c.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Ver">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Editar">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDuplicate(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Duplicar">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
