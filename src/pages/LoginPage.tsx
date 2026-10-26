// GAGO CAMPAIGN OS — Pantalla de inicio de sesión
import { useState } from 'react';
import { useStore } from '../lib/store';
import type { User } from '../lib/types';

export default function LoginPage() {
  const { dispatch } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // En modo demostración, aceptamos cualquier credencial
    // En producción, esto se conecta a POST /api/auth/login
    await new Promise(r => setTimeout(r, 500));

    if (!email || !password) {
      setError('Introduce correo y contraseña.');
      setLoading(false);
      return;
    }

    // Credenciales genéricas no revelan si la cuenta existe
    const user: User = {
      id: 'user-demo-' + Date.now(),
      email: email,
      name: email.split('@')[0] || 'Usuario',
      role: 'admin',
      organizationId: 'org-default',
      createdAt: new Date().toISOString()
    };

    dispatch({ type: 'LOGIN', payload: user });
    setLoading(false);
  };

  const handleDemoLogin = () => {
    const user: User = {
      id: 'user-admin-1',
      email: 'admin@gago.local',
      name: 'Prof. Manuel GAGO FERNÁNDEZ',
      role: 'admin',
      organizationId: 'org-default',
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'LOGIN', payload: user });
    dispatch({ type: 'LOAD_DEMO_DATA' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#0d1a29] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500 mb-4">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-white">GAGO CAMPAIGN OS</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de gestión de campañas publicitarias</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="usuario@ejemplo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#172e4a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-3 text-center">
              Modo demostración disponible
            </p>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Entrar en modo demostración
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Sin registro público. El primer administrador se crea mediante comando de consola.
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Prof. Manuel GAGO FERNÁNDEZ · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
