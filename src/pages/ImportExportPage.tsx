// GAGO CAMPAIGN OS — Importaciones y exportaciones
import { useState, useRef } from 'react';
import { useStore, generateId, now } from '../lib/store';
import type { MetricRow, MetricImport } from '../lib/types';
import { Download, Upload, FileJson, FileText, Printer, AlertCircle, CheckCircle } from 'lucide-react';

interface ParsedRow {
  campaignReference: string;
  date: string;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  source: string;
  errors: string[];
}

function escapeCsvField(value: string): string {
  // Neutralize formula injection
  const dangerous = /^[=+\-@\t\r]/;
  const safe = dangerous.test(value) ? "'" + value : value;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return safe;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function ImportExportPage() {
  const { state, dispatch, addAuditEvent } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importStep, setImportStep] = useState<'idle' | 'preview' | 'done'>('idle');
  const [importResult, setImportResult] = useState<{ accepted: number; rejected: number; errors: string[] } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setParsedRows(rows);
      setImportStep('preview');
    };
    reader.readAsText(file);
  };

  function parseCsv(text: string): ParsedRow[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: ParsedRow = {
        campaignReference: '', date: '', currency: '', spend: 0,
        impressions: 0, clicks: 0, conversions: 0, revenue: 0,
        source: '', errors: []
      };

      headers.forEach((h, idx) => {
        const val = (values[idx] || '').trim();
        switch (h) {
          case 'campaign_reference': row.campaignReference = val; break;
          case 'date': row.date = val; break;
          case 'currency': row.currency = val.toUpperCase(); break;
          case 'spend': row.spend = parseFloat(val) || 0; break;
          case 'impressions': row.impressions = parseInt(val) || 0; break;
          case 'clicks': row.clicks = parseInt(val) || 0; break;
          case 'conversions': row.conversions = parseFloat(val) || 0; break;
          case 'revenue': row.revenue = parseFloat(val) || 0; break;
          case 'source': row.source = val; break;
        }
      });

      // Validate
      if (!row.campaignReference) row.errors.push('campaign_reference vacío');
      if (!row.date || isNaN(Date.parse(row.date))) row.errors.push('fecha inválida');
      if (!row.currency) row.errors.push('moneda vacía');
      if (row.spend < 0) row.errors.push('gasto negativo');
      if (row.impressions < 0) row.errors.push('impresiones negativas');
      if (row.clicks < 0) row.errors.push('clics negativos');
      if (row.conversions < 0) row.errors.push('conversiones negativas');
      if (row.revenue < 0) row.errors.push('ingresos negativos');

      // Check campaign exists
      const campaign = state.campaigns.find(c =>
        c.name === row.campaignReference || c.id === row.campaignReference
      );
      if (!campaign && row.campaignReference) {
        row.errors.push(`campaña desconocida: ${row.campaignReference}`);
      }

      rows.push(row);
    }

    return rows;
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { result.push(current); current = ''; }
        else { current += ch; }
      }
    }
    result.push(current);
    return result;
  }

  const handleConfirmImport = () => {
    if (!state.user) return;

    const validRows = parsedRows.filter(r => r.errors.length === 0);
    const invalidRows = parsedRows.filter(r => r.errors.length > 0);
    const allErrors = invalidRows.flatMap(r => r.errors);

    const metricRows: MetricRow[] = validRows.map(r => {
      const campaign = state.campaigns.find(c =>
        c.name === r.campaignReference || c.id === r.campaignReference
      );
      return {
        id: generateId(),
        importId: '', // Will be set after import creation
        organizationId: state.organization.id,
        campaignId: campaign?.id || '',
        campaignReference: r.campaignReference,
        date: r.date,
        currency: r.currency,
        spendMinorUnits: Math.round(r.spend * 100),
        impressions: r.impressions,
        clicks: r.clicks,
        conversions: Math.round(r.conversions * 100) / 100, // Preserve decimals
        revenueMinorUnits: Math.round(r.revenue * 100),
        source: r.source
      };
    });

    const metricImport: MetricImport = {
      id: generateId(),
      organizationId: state.organization.id,
      fileName,
      fileHash: '', // Would be computed in production
      source: validRows[0]?.source || 'unknown',
      importedBy: state.user.id,
      importedAt: now(),
      rowsAccepted: validRows.length,
      rowsRejected: invalidRows.length,
      errors: allErrors.slice(0, 20),
      formatVersion: '1.0'
    };

    // Set importId on rows
    metricRows.forEach(r => { r.importId = metricImport.id; });

    dispatch({ type: 'ADD_METRIC_IMPORT', payload: metricImport });
    if (metricRows.length > 0) {
      dispatch({ type: 'ADD_METRIC_ROWS', payload: metricRows });
    }

    addAuditEvent('Resultados importados', 'metric_import', metricImport.id,
      `${validRows.length} filas aceptadas, ${invalidRows.length} rechazadas`);

    setImportResult({ accepted: validRows.length, rejected: invalidRows.length, errors: allErrors });
    setImportStep('done');
  };

  // Export functions
  const exportJson = () => {
    const data = {
      schema_version: '1.0',
      exported_at: now(),
      organization: state.organization,
      products: state.products,
      campaigns: state.campaigns,
      creatives: state.creatives,
      evidence: state.evidence,
      review_requests: state.reviewRequests,
      review_decisions: state.reviewDecisions,
      metric_imports: state.metricImports,
      metric_rows: state.metricRows,
      demo_mode: state.demoMode
    };
    downloadFile('gago-campaign-os-export.json', JSON.stringify(data, null, 2), 'application/json');
    addAuditEvent('Exportación JSON', 'export', 'json', `${state.campaigns.length} campañas`);
  };

  const exportCampaignsCsv = () => {
    const headers = ['id', 'name', 'product', 'objective', 'status', 'budget', 'currency', 'start_date', 'end_date'];
    const rows = state.campaigns.map(c => {
      const product = state.products.find(p => p.id === c.productId);
      return [
        c.id, escapeCsvField(c.name), escapeCsvField(product?.name || ''),
        c.objective, c.internalStatus,
        (c.budgetMinorUnits / 100).toString(), c.currency,
        c.startDate, c.endDate
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile('gago-campaigns.csv', csv, 'text/csv');
    addAuditEvent('Exportación CSV campañas', 'export', 'csv_campaigns', `${state.campaigns.length} campañas`);
  };

  const exportCreativesCsv = () => {
    const headers = ['id', 'campaign', 'name', 'headline', 'body', 'cta', 'url', 'version'];
    const rows = state.creatives.map(c => {
      const camp = state.campaigns.find(cc => cc.id === c.campaignId);
      return [
        c.id, escapeCsvField(camp?.name || ''), escapeCsvField(c.name),
        escapeCsvField(c.headline), escapeCsvField(c.body),
        escapeCsvField(c.cta), c.destinationUrl, c.versionNumber
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile('gago-creatives.csv', csv, 'text/csv');
    addAuditEvent('Exportación CSV anuncios', 'export', 'csv_creatives', `${state.creatives.length} anuncios`);
  };

  const exportExpedient = (campaignId: string) => {
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    const product = state.products.find(p => p.id === campaign.productId);
    const creatives = state.creatives.filter(c => c.campaignId === campaignId);
    const evidence = state.evidence.filter(e =>
      e.linkedCampaigns.includes(campaignId) || (product && e.linkedProducts.includes(product.id))
    );
    const review = state.reviewRequests.find(r => r.campaignId === campaignId);
    const isDraft = campaign.internalStatus !== 'approved';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Expediente — ${escapeHtml(campaign.name)}</title>
<style>
body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
h1 { color: #1e3a5f; border-bottom: 2px solid #22c55e; padding-bottom: 10px; }
h2 { color: #1e3a5f; margin-top: 30px; }
.draft { background: #fef3c7; border: 1px solid #fbbf24; padding: 8px 12px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
th, td { text-align: left; padding: 8px; border: 1px solid #e2e8f0; font-size: 14px; }
th { background: #f8fafc; }
.footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style>
</head>
<body>
<h1>Expediente de campaña</h1>
${isDraft ? '<div class="draft">BORRADOR — No aprobado</div>' : ''}
<h2>Identidad del producto</h2>
<table>
<tr><th>Nombre</th><td>${escapeHtml(product?.name || '—')}</td></tr>
<tr><th>Tipo</th><td>${escapeHtml(product?.type || '—')}</td></tr>
<tr><th>Descripción</th><td>${escapeHtml(product?.description || '—')}</td></tr>
</table>

<h2>Campaña</h2>
<table>
<tr><th>Nombre</th><td>${escapeHtml(campaign.name)}</td></tr>
<tr><th>Objetivo</th><td>${escapeHtml(campaign.objective)}</td></tr>
<tr><th>Público previsto</th><td>${escapeHtml(campaign.targetAudience || '—')}</td></tr>
<tr><th>Fechas</th><td>${escapeHtml(campaign.startDate || '—')} — ${escapeHtml(campaign.endDate || '—')}</td></tr>
<tr><th>Presupuesto</th><td>${(campaign.budgetMinorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency: campaign.currency })}</td></tr>
<tr><th>Estado</th><td>${escapeHtml(campaign.internalStatus)}</td></tr>
</table>

<h2>Anuncios (${creatives.length})</h2>
${creatives.map(c => `
<div style="margin: 10px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px;">
<strong>${escapeHtml(c.name)}</strong> (v${c.versionNumber})<br>
<em>${escapeHtml(c.headline)}</em><br>
${escapeHtml(c.body)}<br>
${c.imageRef ? `<small>Imagen: ${escapeHtml(c.imageRef)}</small>` : ''}
</div>
`).join('')}

<h2>Evidencias (${evidence.length})</h2>
${evidence.map(e => `
<div style="margin: 10px 0; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px;">
<strong>${escapeHtml(e.title)}</strong> [${escapeHtml(e.status)}]<br>
${escapeHtml(e.claim)}<br>
${e.limitations ? `<small>Limitaciones: ${escapeHtml(e.limitations)}</small>` : ''}
</div>
`).join('')}

${review ? `
<h2>Revisión</h2>
<table>
<tr><th>Estado</th><td>${escapeHtml(review.status)}</td></tr>
<tr><th>Hash</th><td><code>${escapeHtml(review.snapshotHash)}</code></td></tr>
<tr><th>Solicitada</th><td>${new Date(review.requestedAt).toLocaleString('es-ES')}</td></tr>
</table>
` : ''}

<div class="footer">
<p>Exportado: ${new Date().toLocaleString('es-ES')}</p>
<p>Origen: ${state.demoMode ? 'DEMOSTRACIÓN — Datos sintéticos' : 'Producción'}</p>
<p>GAGO CAMPAIGN OS — Prof. Manuel GAGO FERNÁNDEZ</p>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expediente-${campaign.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEvent('Expediente exportado', 'export', 'expedient', campaign.name);
  };

  function downloadFile(name: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Importaciones y exportaciones</h1>

      {/* Import section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Upload size={20} /> Importar resultados
        </h2>

        {importStep === 'idle' && (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              Selecciona un archivo CSV con columnas: campaign_reference, date, currency, spend, impressions, clicks, conversions, revenue, source.
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a]">
              Seleccionar CSV
            </button>
          </div>
        )}

        {importStep === 'preview' && (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Archivo: <strong>{fileName}</strong> — {parsedRows.length} filas detectadas
            </p>
            <div className="mb-4 max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1">Fecha</th>
                    <th className="text-left px-2 py-1">Campaña</th>
                    <th className="text-right px-2 py-1">Gasto</th>
                    <th className="text-right px-2 py-1">Imp.</th>
                    <th className="text-right px-2 py-1">Clics</th>
                    <th className="text-left px-2 py-1">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className={r.errors.length > 0 ? 'bg-red-50' : ''}>
                      <td className="px-2 py-1">{r.date}</td>
                      <td className="px-2 py-1">{r.campaignReference}</td>
                      <td className="px-2 py-1 text-right">{r.spend.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">{r.impressions}</td>
                      <td className="px-2 py-1 text-right">{r.clicks}</td>
                      <td className="px-2 py-1">
                        {r.errors.length > 0 ? (
                          <span className="text-red-600">{r.errors[0]}</span>
                        ) : (
                          <span className="text-green-600">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button onClick={handleConfirmImport}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
                Confirmar importación
              </button>
              <button onClick={() => { setImportStep('idle'); setParsedRows([]); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {importStep === 'done' && importResult && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-green-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">Importación completada</p>
                <p className="text-xs text-slate-500">
                  {importResult.accepted} filas aceptadas · {importResult.rejected} rechazadas
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-xs font-medium text-red-700 mb-1">Errores:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {importResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <button onClick={() => { setImportStep('idle'); setParsedRows([]); setImportResult(null); }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              Importar otro archivo
            </button>
          </div>
        )}
      </div>

      {/* Export section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Download size={20} /> Exportar datos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={exportJson}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left">
            <FileJson size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-700">JSON estructurado</p>
              <p className="text-xs text-slate-400">Schema v1.0</p>
            </div>
          </button>
          <button onClick={exportCampaignsCsv}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left">
            <FileText size={20} className="text-green-500" />
            <div>
              <p className="text-sm font-medium text-slate-700">CSV Campañas</p>
              <p className="text-xs text-slate-400">{state.campaigns.length} registros</p>
            </div>
          </button>
          <button onClick={exportCreativesCsv}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left">
            <FileText size={20} className="text-purple-500" />
            <div>
              <p className="text-sm font-medium text-slate-700">CSV Anuncios</p>
              <p className="text-xs text-slate-400">{state.creatives.length} registros</p>
            </div>
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left">
            <Printer size={20} className="text-amber-500" />
            <div>
              <p className="text-sm font-medium text-slate-700">Imprimir / PDF</p>
              <p className="text-xs text-slate-400">Usa impresión del navegador</p>
            </div>
          </button>
        </div>
      </div>

      {/* Expedients */}
      {state.campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Exportar expedientes</h2>
          <div className="space-y-2">
            {state.campaigns.map(c => {
              const isDraft = c.internalStatus !== 'approved';
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isDraft && <AlertCircle size={14} className="text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        {isDraft ? 'BORRADOR' : 'Aprobado'} · v{c.version}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => exportExpedient(c.id)}
                    className="px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#172e4a]">
                    Expediente HTML
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import history */}
      {state.metricImports.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Historial de importaciones</h2>
          <div className="space-y-2">
            {state.metricImports.map(imp => (
              <div key={imp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-slate-700">{imp.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(imp.importedAt).toLocaleString('es-ES')} · {imp.rowsAccepted} aceptadas · {imp.rowsRejected} rechazadas
                  </p>
                </div>
                <span className="text-xs text-slate-400">v{imp.formatVersion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
