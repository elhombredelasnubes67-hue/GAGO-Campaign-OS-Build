// GAGO CAMPAIGN OS — Layout principal
import { useState } from 'react';
import { useStore } from '../lib/store';
import {
  LayoutDashboard, Package, Megaphone, FileText, Shield,
  ClipboardCheck, BarChart3, Upload, Settings, LogOut, Menu, X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'products', label: 'Productos y servicios', icon: Package },
  { id: 'campaigns', label: 'Campañas', icon: Megaphone },
  { id: 'creatives', label: 'Anuncios', icon: FileText },
  { id: 'evidence', label: 'Evidencias', icon: Shield },
  { id: 'reviews', label: 'Revisiones', icon: ClipboardCheck },
  { id: 'results', label: 'Resultados', icon: BarChart3 },
  { id: 'import-export', label: 'Importar / Exportar', icon: Upload },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { state, dispatch } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#1e3a5f] text-white shadow-md">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded hover:bg-white/10" aria-label="Menú">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-bold tracking-tight">GAGO CAMPAIGN OS</h1>
        <div className="w-10" />
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden lg:flex items-center px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white font-bold text-sm">G</div>
          <div className="ml-3">
            <h1 className="text-sm font-bold tracking-tight">GAGO CAMPAIGN OS</h1>
            <p className="text-xs text-slate-300">Prof. Manuel GAGO FERNÁNDEZ</p>
          </div>
        </div>

        {state.demoMode && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-500/20 border border-amber-400/30 rounded text-xs text-amber-200">
            ⚠ MODO DEMOSTRACIÓN — Datos sintéticos
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white'}
                `}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold">
              {state.user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{state.user?.name || 'Sin sesión'}</p>
              <p className="text-xs text-slate-400 capitalize">{state.user?.role || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
