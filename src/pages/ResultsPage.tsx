// GAGO CAMPAIGN OS — Resultados y métricas
import { useState, useMemo } from 'react';
import { useStore } from '../lib/store';
import { BarChart3 } from 'lucide-react';

export default function ResultsPage() {
  const { state } = useStore();
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  const sources = useMemo(() => [...new Set(state.metricRows.map(r => r.source))], [state.metricRows]);
  const currencies = useMemo(() => [...new Set(state.metricRows.map(r => r.currency))], [state.metricRows]);

  const filtered = useMemo(() => {
    return state.metricRows.filter(r => {
      if (filterCampaign !== 'all' && r.campaignId !== filterCampaign) return false;
      if (filterCurrency !== 'all' && r.currency !== filterCurrency) return false;
      if (filterSource !== 'all' && r.source !== filterSource) return false;
      return true;
    });
  }, [state.metricRows, filterCampaign, filterCurrency, filterSource]);

  // Group by currency to avoid mixing
  const byCurrency = useMemo(() => {
    const map = new Map<string, {
      spend: number; impressions: number; clicks: number;
      conversions: number; revenue: number; rows: number;
    }>();
    for (const r of filtered) {
      const cur = r.currency;
      if (!map.has(cur)) map.set(cur, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, rows: 0 });
      const agg = map.get(cur)!;
      agg.spend += r.spendMinorUnits;
      agg.impressions += r.impressions;
      agg.clicks += r.clicks;
      agg.conversions += r.conversions;
      agg.revenue += r.revenueMinorUnits;
      agg.rows += 1;
    }
    return map;
  }, [filtered]);

  function formatMoney(minorUnits: number, currency: string): string {
    return (minorUnits / 100).toLocaleString('es-ES', { style: 'currency', currency });
  }

  function calcCTR(clicks: number, impressions: number): string {
    if (impressions === 0) return 'Sin datos';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  }

  function calcCPC(spendMinor: number, clicks: number, currency: string): string {
    if (clicks === 0) return 'Sin datos';
    return formatMoney(Math.round(spendMinor / clicks), currency);
  }

  function calcCPM(spendMinor: number, impressions: number, currency: string): string {
    if (impressions === 0) return 'Sin datos';
    return formatMoney(Math.round((spendMinor / impressions) * 1000), currency);
  }

  function calcCPA(spendMinor: number, conversions: number, currency: string): string {
    if (conversions === 0) return 'Sin datos';
    return formatMoney(Math.round(spendMinor / conversions), currency);
  }

  function calcROAS(revenueMinor: number, spendMinor: number): string {
    if (spendMinor === 0) return 'Sin datos';
    return (revenueMinor / spendMinor).toFixed(2);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Resultados y métricas</h1>
      <p className="text-sm text-slate-500 mb-6">
        {filtered.length} filas de datos importados
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">Todas las campañas</option>
          {state.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">Todas las monedas</option>
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="all">Todas las fuentes</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BarChart3 size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 mb-2">No hay datos de resultados importados.</p>
          <p className="text-xs text-slate-400">Importa un CSV de resultados desde la sección «Importar / Exportar».</p>
        </div>
      ) : (
        <>
          {/* Metrics by currency */}
          <div className="space-y-4 mb-8">
            {Array.from(byCurrency.entries()).map(([currency, agg]) => (
              <div key={currency} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Métricas agregadas — {currency} ({agg.rows} filas)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard label="Gasto total" value={formatMoney(agg.spend, currency)} />
                  <MetricCard label="Ingresos" value={formatMoney(agg.revenue, currency)} />
                  <MetricCard label="Impresiones" value={agg.impressions.toLocaleString('es-ES')} />
                  <MetricCard label="Clics" value={agg.clicks.toLocaleString('es-ES')} />
                  <MetricCard label="Conversiones" value={agg.conversions.toLocaleString('es-ES')} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <MetricCard label="CTR" value={calcCTR(agg.clicks, agg.impressions)} />
                  <MetricCard label="CPC" value={calcCPC(agg.spend, agg.clicks, currency)} />
                  <MetricCard label="CPM" value={calcCPM(agg.spend, agg.impressions, currency)} />
                  <MetricCard label="CPA" value={calcCPA(agg.spend, agg.conversions, currency)} />
                  <MetricCard label="ROAS" value={calcROAS(agg.revenue, agg.spend)} />
                </div>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Datos importados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Fecha</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Campaña</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Gasto</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Impresiones</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Clics</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Conv.</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Ingresos</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 100).map(r => {
                    const camp = state.campaigns.find(c => c.id === r.campaignId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">{camp?.name || r.campaignReference}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(r.spendMinorUnits, r.currency)}</td>
                        <td className="px-3 py-2 text-right">{r.impressions.toLocaleString('es-ES')}</td>
                        <td className="px-3 py-2 text-right">{r.clicks.toLocaleString('es-ES')}</td>
                        <td className="px-3 py-2 text-right">{r.conversions.toLocaleString('es-ES')}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(r.revenueMinorUnits, r.currency)}</td>
                        <td className="px-3 py-2">{r.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 100 && (
              <div className="px-5 py-3 border-t border-slate-200 text-xs text-slate-500">
                Mostrando 100 de {filtered.length} filas.
              </div>
            )}
          </div>

          {/* Disclaimers */}
          <div className="mt-6 space-y-2">
            <p className="text-xs text-slate-400">
              • Denominador cero se muestra como «Sin datos». Valores ausentes no equivalen a cero.
            </p>
            <p className="text-xs text-slate-400">
              • No se suman importes de monedas diferentes. No se inventan conversiones ni se atribuye causalidad.
            </p>
            <p className="text-xs text-slate-400">
              • Las métricas agregadas suman primero numeradores y denominadores para calcular ratios.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
