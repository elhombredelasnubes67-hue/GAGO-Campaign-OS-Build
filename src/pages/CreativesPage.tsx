// GAGO CAMPAIGN OS — Anuncios
import { useState } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { Creative, CreativeVersion } from '../lib/types';
import { Plus, Edit2, Trash2, Copy, X, Eye, History } from 'lucide-react';

function emptyCreative(orgId: string, userId: string, campaignId: string): Creative {
  return {
    id: generateId(), organizationId: orgId, campaignId, name: '',
    headline: '', body: '', cta: '', destinationUrl: '', language: 'es',
    imageRef: '', imageAlt: '', notes: '', evidenceIds: [], versionNumber: 1,
    status: 'active', createdAt: now(), updatedAt: now(), createdBy: userId
  };
}

export default function CreativesPage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const [editing, setEditing] = useState<Creative | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [showVersions, setShowVersions] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [formError, setFormError] = useState('');

  // Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genProduct, setGenProduct] = useState('');
  const [genAudience, setGenAudience] = useState('');
  const [genBenefit, setGenBenefit] = useState('');
  const [genTone, setGenTone] = useState('formal');
  const [genResult, setGenResult] = useState('');

  const filtered = state.creatives.filter(c =>
    filterCampaign === 'all' || c.campaignId === filterCampaign
  );

  const handleNew = (campaignId?: string) => {
    if (!state.user) return;
    const cid = campaignId || (state.campaigns[0]?.id ?? '');
    if (!cid) { alert('Crea primero una campaña.'); return; }
    setEditing(emptyCreative(state.organization.id, state.user.id, cid));
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = (c: Creative) => {
    setEditing({ ...c });
    setShowForm(true);
    setFormError('');
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (!editing.campaignId) { setFormError('Selecciona una campaña.'); return; }

    const existing = state.creatives.find(c => c.id === editing.id);
    const updated = { ...editing, updatedAt: now() };

    if (existing) {
      // Save version snapshot before updating
      const versionSnapshot: CreativeVersion = {
        id: generateId(), creativeId: existing.id,
        versionNumber: existing.versionNumber,
        headline: existing.headline, body: existing.body,
        cta: existing.cta, destinationUrl: existing.destinationUrl,
        imageRef: existing.imageRef,
        changedAt: now(), changedBy: state.user!.id
      };
      dispatch({ type: 'ADD_CREATIVE_VERSION', payload: versionSnapshot });
      updated.versionNumber = existing.versionNumber + 1;
      dispatch({ type: 'UPDATE_CREATIVE', payload: updated });
      addAuditEvent('Anuncio actualizado', 'creative', updated.id, updated.name);
    } else {
      dispatch({ type: 'ADD_CREATIVE', payload: updated });
      addAuditEvent('Anuncio creado', 'creative', updated.id, updated.name);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDuplicate = (c: Creative) => {
    if (!state.user) return;
    const dup: Creative = {
      ...c, id: generateId(), name: c.name + ' (copia)',
      versionNumber: 1, status: 'active',
      createdAt: now(), updatedAt: now(), createdBy: state.user.id
    };
    dispatch({ type: 'ADD_CREATIVE', payload: dup });
    addAuditEvent('Anuncio duplicado', 'creative', dup.id, dup.name);
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Archivar este anuncio?')) return;
    dispatch({ type: 'DELETE_CREATIVE', payload: id });
    addAuditEvent('Anuncio eliminado', 'creative', id, '');
  };

  const handleGenerate = () => {
    // Plantilla local determinista — no es generación con IA
    const templates: Record<string, string[]> = {
      formal: [
        `{headline}: ${genBenefit || 'Solución profesional'} para ${genAudience || 'su negocio'}.`,
        `Descubra cómo ${genProduct || 'nuestro servicio'} puede transformar su ${genAudience || 'actividad'}.`,
      ],
      cercano: [
        `¿Buscas ${genBenefit || 'mejores resultados'}? ${genProduct || 'Te ayudamos'} con ${genAudience || 'tu proyecto'}.`,
        `${genBenefit || 'El cambio'} que ${genAudience || 'necesitas'} está a un clic.`,
      ],
      directo: [
        `${genBenefit || 'Resultados reales'} para ${genAudience || 'profesionales'}. ${genProduct || 'Empieza hoy'}.`,
        `${genAudience || 'Profesionales'} que eligen ${genProduct || 'lo mejor'}. ${genBenefit || 'Comprobado'}.`,
      ]
    };
    const t = templates[genTone] || templates.formal;
    setGenResult(t.map((tpl, i) =>
      tpl.replace('{headline}', `Variante ${i + 1}`)
    ).join('\n\n'));
  };

  const preview = showPreview ? state.creatives.find(c => c.id === showPreview) : null;
  const previewCampaign = preview ? state.campaigns.find(c => c.id === preview.campaignId) : null;
  const versions = showVersions ? state.creativeVersions.filter(v => v.creativeId === showVersions).sort((a, b) => b.versionNumber - a.versionNumber) : [];
  const versionsCreative = showVersions ? state.creatives.find(c => c.id === showVersions) : null;

  if (showPreview && preview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Vista previa</h1>
          <button onClick={() => setShowPreview(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            Vista previa interna. La presentación final depende de la plataforma publicitaria.
          </div>
          <div className="max-w-md mx-auto border border-slate-200 rounded-xl overflow-hidden">
            {preview.imageRef && (
              <div className="h-48 bg-slate-100 flex items-center justify-center">
                <img src={preview.imageRef} alt={preview.imageAlt || preview.name} className="max-h-full max-w-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-1">{previewCampaign?.name || 'Campaña'}</p>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{preview.headline || '(Sin titular)'}</h3>
              <p className="text-sm text-slate-600 mb-3">{preview.body || '(Sin texto)'}</p>
              {preview.cta && (
                <button className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm">
                  {preview.cta}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showVersions && versionsCreative) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Versiones: {versionsCreative.name}</h1>
          <button onClick={() => setShowVersions(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Versión actual (v{versionsCreative.versionNumber})</h3>
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium">{versionsCreative.headline}</p>
              <p className="text-slate-600">{versionsCreative.body}</p>
            </div>
          </div>
          {versions.length === 0 ? (
            <p className="text-sm text-slate-400">Sin versiones anteriores registradas.</p>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Historial</h3>
              <div className="space-y-3">
                {versions.map(v => (
                  <div key={v.id} className="p-3 border border-slate-200 rounded-lg text-sm">
                    <p className="text-xs text-slate-400 mb-1">v{v.versionNumber} — {new Date(v.changedAt).toLocaleString('es-ES')}</p>
                    <p className="font-medium text-slate-700">{v.headline}</p>
                    <p className="text-slate-600">{v.body}</p>
                    {v.destinationUrl !== versionsCreative.destinationUrl && (
                      <p className="text-xs text-amber-600 mt-1">URL modificada</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showForm && editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {state.creatives.find(c => c.id === editing.id) ? 'Editar anuncio' : 'Nuevo anuncio'}
          </h1>
          <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaña *</label>
              <select value={editing.campaignId} onChange={e => setEditing({ ...editing, campaignId: e.target.value })}
                className="input">
                <option value="">Seleccionar...</option>
                {state.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre interno *</label>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
                className="input" placeholder="Nombre del anuncio" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titular</label>
            <input value={editing.headline} onChange={e => setEditing({ ...editing, headline: e.target.value })}
              className="input" placeholder="Titular del anuncio" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Texto</label>
            <textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })}
              className="input" rows={3} placeholder="Texto del anuncio" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Llamada a la acción</label>
              <input value={editing.cta} onChange={e => setEditing({ ...editing, cta: e.target.value })}
                className="input" placeholder="Más información" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL de destino</label>
              <input value={editing.destinationUrl} onChange={e => setEditing({ ...editing, destinationUrl: e.target.value })}
                className="input" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Referencia de imagen (HTTPS)</label>
              <input value={editing.imageRef} onChange={e => setEditing({ ...editing, imageRef: e.target.value })}
                className="input" placeholder="https://.../imagen.jpg" />
              <p className="text-xs text-slate-400 mt-1">La selección local es solo temporal y no se guarda.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Texto alternativo</label>
              <input value={editing.imageAlt} onChange={e => setEditing({ ...editing, imageAlt: e.target.value })}
                className="input" />
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
          <h1 className="text-2xl font-bold text-slate-800">Anuncios</h1>
          <p className="text-sm text-slate-500">{filtered.length} anuncios</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="all">Todas las campañas</option>
            {state.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowGenerator(!showGenerator)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
            Generador
          </button>
          <button onClick={() => handleNew()} className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {showGenerator && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Generador de variantes (plantillas locales)</h3>
          <p className="text-xs text-slate-500 mb-3">Genera variantes mediante plantillas deterministas. No utiliza IA.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <input value={genProduct} onChange={e => setGenProduct(e.target.value)} className="input" placeholder="Producto/servicio" />
            <input value={genAudience} onChange={e => setGenAudience(e.target.value)} className="input" placeholder="Público" />
            <input value={genBenefit} onChange={e => setGenBenefit(e.target.value)} className="input" placeholder="Beneficio clave" />
            <select value={genTone} onChange={e => setGenTone(e.target.value)} className="input">
              <option value="formal">Formal</option>
              <option value="cercano">Cercano</option>
              <option value="directo">Directo</option>
            </select>
          </div>
          <button onClick={handleGenerate} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 mb-3">
            Generar variantes
          </button>
          {genResult && (
            <pre className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">{genResult}</pre>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay anuncios registrados.</p>
          <button onClick={() => handleNew()} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            Crear primer anuncio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const camp = state.campaigns.find(cc => cc.id === c.campaignId);
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-400">{camp?.name || 'Sin campaña'}</p>
                    <h3 className="font-medium text-slate-800">{c.name}</h3>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">v{c.versionNumber}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1 line-clamp-2">{c.headline}</p>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{c.body}</p>
                <div className="flex gap-1">
                  <button onClick={() => setShowPreview(c.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Vista previa">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => setShowVersions(c.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Versiones">
                    <History size={14} />
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDuplicate(c)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Duplicar">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
