import { useState } from 'react';
import { API_BASE_URL } from '../config/api';

export default function RecuperarPassword({ onVolver }: { onVolver: () => void }) {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recuperar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMensaje(data.mensaje);
      setEnviado(true);
    } catch {
      setError('Error al enviar la solicitud. Intente nuevamente.');
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

        <h2 className="text-xl font-semibold text-gray-700 mb-2 text-center">
          Recuperar contraseña
        </h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {enviado ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-4 rounded-lg mb-6 text-sm">
              {mensaje}
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
            </p>
            <button
              onClick={onVolver}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Volver al login
            </button>
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <button
              type="button"
              onClick={onVolver}
              className="w-full text-blue-700 hover:text-blue-900 text-sm font-medium transition"
            >
              ← Volver al login
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