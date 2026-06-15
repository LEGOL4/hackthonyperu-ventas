import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export default function RestablecerPassword({ onExito }: { onExito: () => void }) {
  const [token, setToken] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setError('Token no encontrado. Solicita un nuevo enlace de recuperación.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (nuevaPassword.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/restablecer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.mensaje || 'Error al restablecer contraseña');
        return;
      }
      setMensaje(data.mensaje);
      setExito(true);
    } catch {
      setError('Error al conectar con el servidor');
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
          Nueva contraseña
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {exito ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-4 rounded-lg mb-6 text-sm">
              {mensaje}
            </div>
            <button
              onClick={onExito}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Ir al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={e => setConfirmarPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={cargando || !token}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              {cargando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          © 2026 GRUPO HACKTHONYPERU S.A.C
        </p>
      </div>
    </div>
  );
}