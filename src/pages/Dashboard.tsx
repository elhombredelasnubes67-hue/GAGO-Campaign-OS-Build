// GAGO CAMPAIGN OS — Panel principal
import { useStore } from '../lib/store';
import { Package, Megaphone, ClipboardCheck, CheckCircle, AlertCircle } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { state } = useStore();

  const activeProducts = state.products.filter(p => p.status === 'active').length;
  const draftCampaigns = state.campaigns.filter(c => c.internalStatus === 'draft').length;
  const pendingReviews = state.reviewRequests.filter(r => r.status === 'pending').length;
  const approvedCampaigns = state.campaigns.filter(c => c.internalStatus === 'approved').length;

  const totalBudget = state.campaigns.reduce((sum, c) => sum + c.budgetMinorUnits, 0);
  const totalSpend = state.metricRows.reduce((sum, r) => sum + r.spendMinorUnits, 0);

  const recentEvents = state.auditEvents.slice(-5).reverse();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Panel de control</h1>
        <p className="text-slate-500 text-sm mt-1">
          Resumen de actividad — {state.demoMode ? 'Modo demostración' : 'Datos en producción'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Package size={20} className="text-blue-500" />}
          label="Productos activos"
          value={activeProducts}
          onClick={() => onNavigate('products')}
        />
        <StatCard
          icon={<Megaphone size={20} className="text-amber-500" />}
          label="Campañas en borrador"
          value={draftCampaigns}
          onClick={() => onNavigate('campaigns')}
        />
        <StatCard
          icon={<ClipboardCheck size={20} className="text-purple-500" />}
          label="Revisiones pendientes"
          value={pendingReviews}
          onClick={() => onNavigate('reviews')}
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-500" />}
          label="Campañas aprobadas"
          value={approvedCampaigns}
          onClick={() => onNavigate('campaigns')}
        />
      </div>

      {/* Budget section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Presupuesto previsto</h3>
          <p className="text-2xl font-bold text-slate-800">
            {(totalBudget / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Suma de campañas registradas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Gasto importado</h3>
          <p className="text-2xl font-bold text-slate-800">
            {totalSpend > 0
              ? (totalSpend / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
              : 'Sin datos'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {state.metricRows.length > 0 ? `${state.metricRows.length} filas importadas` : 'Importa resultados para ver gasto real'}
          </p>
        </div>
      </div>

      {/* Empty state or activity */}
      {state.campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">Sin campañas registradas</h3>
          <p className="text-sm text-slate-500 mb-4">
            Crea tu primer producto y campaña para comenzar a organizar tu trabajo publicitario.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a] transition-colors"
          >
            Crear primer producto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Últimas actividades</h3>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-slate-400">No hay actividad registrada aún.</p>
          ) : (
            <ul className="space-y-3">
              {recentEvents.map(event => (
                <li key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{event.actorName}</span> — {event.action}
                    </p>
                    <p className="text-xs text-slate-400">
                      {event.resourceType} · {new Date(event.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, onClick }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </button>
  );
}
