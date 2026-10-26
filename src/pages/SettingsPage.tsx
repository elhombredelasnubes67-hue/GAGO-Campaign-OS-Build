// GAGO CAMPAIGN OS — Configuración
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Shield, Database, Users, Globe, Info } from 'lucide-react';

export default function SettingsPage() {
  const { state } = useStore();

  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Info },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'database', label: 'Base de datos', icon: Database },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'integrations', label: 'Integraciones', icon: Globe },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configuración</h1>

      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-green-500 text-green-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Organización</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input value={state.organization.name} readOnly className="input bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zona horaria</label>
                <input value={state.organization.timezone} readOnly className="input bg-slate-50" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Estado del sistema</h3>
            <div className="space-y-3">
              <StatusRow label="Modo" value={state.demoMode ? 'DEMOSTRACIÓN' : 'Producción'}
                color={state.demoMode ? 'amber' : 'green'} />
              <StatusRow label="Productos" value={state.products.length.toString()} />
              <StatusRow label="Campañas" value={state.campaigns.length.toString()} />
              <StatusRow label="Anuncios" value={state.creatives.length.toString()} />
              <StatusRow label="Evidencias" value={state.evidence.length.toString()} />
              <StatusRow label="Revisiones" value={state.reviewRequests.length.toString()} />
              <StatusRow label="Filas de métricas" value={state.metricRows.length.toString()} />
              <StatusRow label="Eventos de auditoría" value={state.auditEvents.length.toString()} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Acerca de GAGO CAMPAIGN OS</h3>
            <p className="text-xs text-blue-700 mb-2">
              Herramienta para organizar productos y servicios, preparar campañas publicitarias,
              redactar anuncios, reunir evidencias, aprobar versiones, exportar expedientes e importar resultados reales.
            </p>
            <p className="text-xs text-blue-600">
              Prof. Manuel GAGO FERNÁNDEZ · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Configuración de seguridad</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>• Consultas SQL parametrizadas (backend Go)</p>
              <p>• Validación de entradas en servidor</p>
              <p>• Cookies HttpOnly y Secure en producción</p>
              <p>• Protección CSRF en operaciones de escritura</p>
              <p>• Contraseñas con Argon2id</p>
              <p>• Caducidad y revocación de sesiones</p>
              <p>• Autorización por organización en servidor</p>
              <p>• Sin secretos en frontend</p>
              <p>• Sin claves en variables VITE_*</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Certificado digital UE</h3>
            <p className="text-xs text-amber-700">
              El certificado digital UE es un requisito futuro del ecosistema.
              La interfaz de autenticación está preparada para ser ampliable,
              pero la validación de certificados no está implementada.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Sesión actual</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Usuario:</span> {state.user?.name}</p>
              <p><span className="text-slate-500">Correo:</span> {state.user?.email}</p>
              <p><span className="text-slate-500">Rol:</span> <span className="capitalize">{state.user?.role}</span></p>
              <p><span className="text-slate-500">Organización:</span> {state.organization.name}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Base de datos</h3>
            {state.demoMode ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">Modo demostración activo</p>
                <p className="text-xs text-amber-700 mt-1">
                  Los datos se almacenan en memoria del navegador. No se utiliza PostgreSQL.
                  Configure DATABASE_URL para habilitar persistencia real.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Conectado a PostgreSQL</p>
                <p className="text-xs text-green-700 mt-1">
                  Persistencia activa con migraciones versionadas.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Variables de entorno necesarias</h3>
            <div className="space-y-2 font-mono text-xs">
              <p className="p-2 bg-slate-50 rounded">DATABASE_URL=<span className="text-slate-400"># PostgreSQL connection string</span></p>
              <p className="p-2 bg-slate-50 rounded">APP_ORIGIN=<span className="text-slate-400"># URL pública de la aplicación</span></p>
              <p className="p-2 bg-slate-50 rounded">APP_ENV=<span className="text-slate-400"># production | development</span></p>
              <p className="p-2 bg-slate-50 rounded">SESSION_TTL_HOURS=<span className="text-slate-400"># Duración de sesión (ej: 24)</span></p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Roles y permisos</h3>
            <div className="space-y-4">
              <RoleCard
                role="Administrador"
                permissions={['Gestión de usuarios', 'Configuración completa', 'Acceso a todos los módulos']}
              />
              <RoleCard
                role="Editor"
                permissions={['Productos, campañas, anuncios y evidencias', 'Solicitar revisión', 'No puede aprobar sus propias versiones']}
              />
              <RoleCard
                role="Revisor"
                permissions={['Consultar expedientes', 'Aprobar o rechazar versiones', 'No modifica contenidos en revisión']}
              />
              <RoleCard
                role="Lector"
                permissions={['Consulta y exportación', 'Sin permisos de modificación']}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Usuarios de la organización</h3>
            {state.user && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold">
                  {state.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{state.user.name}</p>
                  <p className="text-xs text-slate-400">{state.user.email} · {state.user.role}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3">
              En producción, la gestión de usuarios se realiza desde el backend Go.
              El primer administrador se crea con el comando de consola.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Integraciones publicitarias</h3>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800 font-medium">Aviso importante</p>
              <p className="text-xs text-amber-700 mt-1">
                Esta herramienta prepara y registra campañas. La creación, revisión y publicación
                en una plataforma externa se realiza mediante sus canales autorizados.
              </p>
            </div>

            <div className="space-y-3">
              <IntegrationCard
                name="ChatGPT Ads Manager"
                status="Preparación de expedientes"
                description="Se preparan expedientes para su traslado manual. No hay publicación automática."
                active={false}
              />
              <IntegrationCard
                name="Proveedor de IA (futuro)"
                status="Interfaz preparada, desactivada"
                description="Se puede activar un proveedor de IA futuro para generación de variantes. Sin integración ficticia."
                active={false}
              />
              <IntegrationCard
                name="Certificado digital UE"
                status="Requisito futuro"
                description="Interfaz de autenticación ampliable. Validación no implementada."
                active={false}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Adaptadores</h3>
            <p className="text-sm text-slate-500">
              La arquitectura incluye una interfaz de adaptadores para futuras integraciones.
              No se activan proveedores no implementados. No se simula publicación ni gasto publicitario.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'text-amber-700 bg-amber-100',
    green: 'text-green-700 bg-green-100',
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium px-2 py-0.5 rounded ${color ? colorClasses[color] || '' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}

function RoleCard({ role, permissions }: { role: string; permissions: string[] }) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg">
      <h4 className="text-sm font-semibold text-slate-700 mb-2">{role}</h4>
      <ul className="space-y-1">
        {permissions.map((p, i) => (
          <li key={i} className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntegrationCard({ name, status, description, active }: {
  name: string; status: string; description: string; active: boolean;
}) {
  return (
    <div className={`p-4 border rounded-lg ${active ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-semibold text-slate-700">{name}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
          {status}
        </span>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
