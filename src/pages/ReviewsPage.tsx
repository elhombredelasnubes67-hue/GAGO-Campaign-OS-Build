// GAGO CAMPAIGN OS — Revisiones y aprobaciones
import { useState } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { ReviewRequest, ReviewDecision } from '../lib/types';
import { Shield, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';

// SHA-256 hash function using Web Crypto API
async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ReviewsPage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const [viewingSnapshot, setViewingSnapshot] = useState<string | null>(null);
  const [decisionForm, setDecisionForm] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approved' | 'changes_requested' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  const pendingRequests = state.reviewRequests.filter(r => r.status === 'pending');
  const resolvedRequests = state.reviewRequests.filter(r => r.status !== 'pending');

  const handleRequestReview = async (campaignId: string) => {
    if (!state.user) return;

    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const product = state.products.find(p => p.id === campaign.productId);
    const creatives = state.creatives.filter(c => c.campaignId === campaignId);
    const evidence = state.evidence.filter(e =>
      e.linkedCampaigns.includes(campaignId) || e.linkedProducts.includes(campaign.productId)
    );

    const snapshot = {
      campaign: {
        id: campaign.id, name: campaign.name, objective: campaign.objective,
        budgetMinorUnits: campaign.budgetMinorUnits, currency: campaign.currency,
        startDate: campaign.startDate, endDate: campaign.endDate,
        targetAudience: campaign.targetAudience, version: campaign.version
      },
      product: product ? { id: product.id, name: product.name, type: product.type } : null,
      creatives: creatives.map(c => ({
        id: c.id, name: c.name, headline: c.headline, body: c.body,
        cta: c.cta, destinationUrl: c.destinationUrl, imageRef: c.imageRef,
        versionNumber: c.versionNumber
      })),
      evidence: evidence.map(e => ({
        id: e.id, title: e.title, claim: e.claim, status: e.status
      })),
      requestedAt: now(),
      requestedBy: state.user.id
    };

    const stableJson = JSON.stringify(snapshot, Object.keys(snapshot).sort());
    const hash = await computeHash(stableJson);

    const request: ReviewRequest = {
      id: generateId(),
      organizationId: state.organization.id,
      campaignId,
      snapshotHash: hash,
      snapshotData: snapshot as unknown as Record<string, unknown>,
      status: 'pending',
      requestedBy: state.user.id,
      requestedAt: now(),
      version: campaign.version
    };

    dispatch({ type: 'ADD_REVIEW_REQUEST', payload: request });

    // Update campaign status
    dispatch({
      type: 'UPDATE_CAMPAIGN',
      payload: { ...campaign, internalStatus: 'in_review', updatedAt: now() }
    });

    addAuditEvent('Revisión solicitada', 'review_request', request.id, campaign.name);
  };

  const handleDecision = () => {
    if (!decisionForm || !state.user) return;
    const request = state.reviewRequests.find(r => r.id === decisionForm);
    if (!request) return;

    // Prevent self-approval
    if (request.requestedBy === state.user.id && decision === 'approved') {
      setFormError('No puedes aprobar tu propia solicitud de revisión.');
      return;
    }

    if ((decision === 'changes_requested' || decision === 'rejected') && !comment.trim()) {
      setFormError('El comentario es obligatorio para cambios solicitados o rechazo.');
      return;
    }

    const reviewDecision: ReviewDecision = {
      id: generateId(),
      reviewRequestId: request.id,
      decision,
      comment,
      decidedBy: state.user.id,
      decidedAt: now()
    };

    dispatch({ type: 'ADD_REVIEW_DECISION', payload: reviewDecision });

    // Update request status
    const statusMap: Record<string, ReviewRequest['status']> = {
      approved: 'approved',
      changes_requested: 'changes_requested',
      rejected: 'rejected'
    };
    dispatch({
      type: 'UPDATE_REVIEW_REQUEST',
      payload: { ...request, status: statusMap[decision] }
    });

    // Update campaign status
    const campaign = state.campaigns.find(c => c.id === request.campaignId);
    if (campaign) {
      const campaignStatusMap: Record<string, Campaign['internalStatus']> = {
        approved: 'approved',
        changes_requested: 'changes_requested',
        rejected: 'draft'
      };
      dispatch({
        type: 'UPDATE_CAMPAIGN',
        payload: { ...campaign, internalStatus: campaignStatusMap[decision] as Campaign['internalStatus'], updatedAt: now() }
      });
    }

    addAuditEvent(`Revisión ${decision === 'approved' ? 'aprobada' : decision === 'rejected' ? 'rechazada' : 'cambios solicitados'}`,
      'review_request', request.id, comment.slice(0, 50));

    setDecisionForm(null);
    setComment('');
    setFormError('');
  };

  const snapshot = viewingSnapshot ? state.reviewRequests.find(r => r.id === viewingSnapshot) : null;
  const snapshotCampaign = snapshot ? state.campaigns.find(c => c.id === snapshot.campaignId) : null;
  const snapshotDecisions = snapshot ? state.reviewDecisions.filter(d => d.reviewRequestId === snapshot.id) : [];

  // Campaigns available for review request (draft or changes_requested, not already pending)
  const availableCampaigns = state.campaigns.filter(c => {
    if (c.internalStatus !== 'draft' && c.internalStatus !== 'changes_requested') return false;
    const hasPending = state.reviewRequests.some(r => r.campaignId === c.id && r.status === 'pending');
    return !hasPending;
  });

  if (viewingSnapshot && snapshot) {
    const snap = snapshot.snapshotData as any;
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Instantánea de revisión</h1>
          <button onClick={() => setViewingSnapshot(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">
            Volver
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-700">Hash SHA-256</p>
              <code className="text-xs text-slate-500 break-all">{snapshot.snapshotHash}</code>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            El hash permite detectar cambios respecto de la instantánea conservada. No constituye firma electrónica,
            sello cualificado ni prueba de veracidad del contenido.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Campaña</p>
              <p className="text-sm font-medium">{snap.campaign?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Producto</p>
              <p className="text-sm font-medium">{snap.product?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Presupuesto</p>
              <p className="text-sm font-medium">
                {snap.campaign ? (snap.campaign.budgetMinorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency: snap.campaign.currency }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Versión</p>
              <p className="text-sm font-medium">v{snapshot.version}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Solicitado por</p>
              <p className="text-sm font-medium">{snapshot.requestedBy === state.user?.id ? state.user.name : snapshot.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha</p>
              <p className="text-sm font-medium">{new Date(snapshot.requestedAt).toLocaleString('es-ES')}</p>
            </div>
          </div>

          {snap.creatives?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Anuncios ({snap.creatives.length})</h3>
              <div className="space-y-2">
                {snap.creatives.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="font-medium">{c.name} <span className="text-xs text-slate-400">v{c.versionNumber}</span></p>
                    <p className="text-slate-600">{c.headline}</p>
                    {c.imageRef && <p className="text-xs text-slate-400">Imagen: {c.imageRef}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {snap.evidence?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Evidencias ({snap.evidence.length})</h3>
              <div className="space-y-2">
                {snap.evidence.map((e: any) => (
                  <div key={e.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-slate-600">{e.claim}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snapshotDecisions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Decisiones</h3>
              <div className="space-y-2">
                {snapshotDecisions.map(d => (
                  <div key={d.id} className="p-3 border border-slate-200 rounded-lg text-sm">
                    <p className="font-medium">
                      {d.decision === 'approved' ? '✅ Aprobado' : d.decision === 'rejected' ? '❌ Rechazado' : '🔄 Cambios solicitados'}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(d.decidedAt).toLocaleString('es-ES')}</p>
                    {d.comment && <p className="text-slate-600 mt-1">{d.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Revisiones y aprobaciones</h1>
      <p className="text-sm text-slate-500 mb-6">
        La solicitud de revisión congela una versión concreta del expediente.
      </p>

      {/* Request review */}
      {availableCampaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Solicitar revisión</h3>
          <div className="space-y-2">
            {availableCampaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.name}</p>
                  <p className="text-xs text-slate-400">v{c.version} · {c.internalStatus === 'draft' ? 'Borrador' : 'Cambios solicitados'}</p>
                </div>
                <button onClick={() => handleRequestReview(c.id)}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600">
                  Solicitar revisión
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending reviews */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Pendientes ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-400">No hay revisiones pendientes.</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(r => {
              const campaign = state.campaigns.find(c => c.id === r.campaignId);
              const isSelf = r.requestedBy === state.user?.id;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-blue-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{campaign?.name || 'Campaña'}</p>
                      <p className="text-xs text-slate-400">
                        v{r.version} · Solicitada {new Date(r.requestedAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <button onClick={() => setViewingSnapshot(r.id)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Ver instantánea">
                      <Eye size={16} />
                    </button>
                  </div>
                  {!isSelf && state.user?.role !== 'reader' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setDecisionForm(r.id); setDecision('approved'); setFormError(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                        <CheckCircle size={13} /> Aprobar
                      </button>
                      <button onClick={() => { setDecisionForm(r.id); setDecision('changes_requested'); setFormError(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
                        <MessageSquare size={13} /> Cambios
                      </button>
                      <button onClick={() => { setDecisionForm(r.id); setDecision('rejected'); setFormError(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
                        <XCircle size={13} /> Rechazar
                      </button>
                    </div>
                  )}
                  {isSelf && (
                    <p className="text-xs text-amber-600 mt-2">No puedes aprobar tu propia solicitud.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision form modal */}
      {decisionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {decision === 'approved' ? 'Aprobar revisión' : decision === 'rejected' ? 'Rechazar revisión' : 'Solicitar cambios'}
            </h3>
            {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{formError}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Comentario {decision !== 'approved' && '*'}
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                className="input" rows={3} placeholder="Comentario para el autor..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleDecision}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${
                  decision === 'approved' ? 'bg-green-500 hover:bg-green-600' :
                  decision === 'rejected' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-amber-500 hover:bg-amber-600'
                }`}>
                Confirmar
              </button>
              <button onClick={() => { setDecisionForm(null); setComment(''); setFormError(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolved reviews */}
      {resolvedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Historial ({resolvedRequests.length})</h2>
          <div className="space-y-2">
            {resolvedRequests.map(r => {
              const campaign = state.campaigns.find(c => c.id === r.campaignId);
              const lastDecision = state.reviewDecisions
                .filter(d => d.reviewRequestId === r.id)
                .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0];
              return (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{campaign?.name || 'Campaña'}</p>
                    <p className="text-xs text-slate-400">
                      {r.status === 'approved' ? '✅ Aprobada' : r.status === 'rejected' ? '❌ Rechazada' : '🔄 Cambios solicitados'}
                      {lastDecision && ` · ${new Date(lastDecision.decidedAt).toLocaleDateString('es-ES')}`}
                    </p>
                  </div>
                  <button onClick={() => setViewingSnapshot(r.id)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                    <Eye size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Campaign type for the status map
import type { Campaign } from '../lib/types';
