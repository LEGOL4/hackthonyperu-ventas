import { useState } from 'react';
import { login, guardarSesion } from '../services/authService';

interface Props {
  onLoginExitoso: () => void;
  onRecuperar: () => void;
}

export default function Login({ onLoginExitoso, onRecuperar }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await login({ email, password });
      guardarSesion(res.token, res.usuario);
      onLoginExitoso();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">HACKTHONYPERU</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Ventas S.A.C</p>
          <div className="mt-4 h-1 w-16 bg-blue-700 mx-auto rounded"></div>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          Iniciar Sesión
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={onRecuperar}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {cargando ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-8">
          © 2026 GRUPO HACKTHONYPERU S.A.C
        </p>
      </div>
    </div>
  );
}