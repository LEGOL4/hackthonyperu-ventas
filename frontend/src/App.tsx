import { useEffect, useState, useCallback } from 'react';
import Clientes from './components/Clientes';
import Login from './components/Login';
import Productos from './components/Productos';
import Categorias from './components/Categorias';
import Pedidos from './components/Pedidos';
import Facturas from './components/Facturas';
import Reportes from './components/Reportes';
import RecuperarPassword from './components/RecuperarPassword';
import RestablecerPassword from './components/RestablecerPassword';
import AlertaInactividad from './components/AlertaInactividad';
import { useInactividad } from './hooks/useInactividad';
import { useAlertasStock } from './hooks/useAlertasStock';
import { getToken, getUsuario, logout } from './services/authService';
import type { Usuario } from './services/authService';

type Vista = 'clientes' | 'productos' | 'categorias' | 'pedidos' | 'facturas' | 'reportes';
type Pantalla = 'login' | 'recuperar' | 'restablecer' | 'app';

const MENU: { key: Vista; label: string }[] = [
  { key: 'clientes', label: 'Clientes' },
  { key: 'categorias', label: 'Categorías' },
  { key: 'productos', label: 'Productos' },
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'facturas', label: 'Facturas' },
  { key: 'reportes', label: 'Reportes' },
];

function App() {
  const [pantalla, setPantalla] = useState<Pantalla>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return 'restablecer';
    if (getToken()) return 'app';
    return 'login';
  });
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vista, setVista] = useState<Vista>('clientes');
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // Hook de alertas de stock
  const { alertas, total } = useAlertasStock(pantalla === 'app');

  useEffect(() => {
    if (pantalla === 'app') setUsuario(getUsuario());
  }, [pantalla]);

  // ── Logout centralizado (manual o por inactividad) ──────────────────────────
  const handleLogout = useCallback(async () => {
    setMostrarAlerta(false);
    await logout();
    setUsuario(null);
    setPantalla('login');
  }, []);

  // ── Callbacks para el hook de inactividad ───────────────────────────────────
  const handleAlerta = useCallback(() => {
    setMostrarAlerta(true);
  }, []);

  // ── Hook de inactividad ─────────────────────────────────────────────────────
  const { segundosRestantes, reiniciarContador } = useInactividad({
    minutosAlerta: 13,
    minutosLogout: 15,
    onAlerta: handleAlerta,
    onLogout: handleLogout,
    activo: pantalla === 'app',   // solo vigila cuando hay sesión
  });

  const handleContinuarSesion = useCallback(() => {
    setMostrarAlerta(false);
    reiniciarContador();
  }, [reiniciarContador]);

  // ── Pantallas sin sesión ─────────────────────────────────────────────────────
  if (pantalla === 'recuperar') {
    return <RecuperarPassword onVolver={() => setPantalla('login')} />;
  }

  if (pantalla === 'restablecer') {
    return (
      <RestablecerPassword
        onExito={() => {
          window.history.replaceState({}, '', '/');
          setPantalla('login');
        }}
      />
    );
  }

  if (pantalla === 'login') {
    return (
      <Login
        onLoginExitoso={() => {
          setUsuario(getUsuario());
          setPantalla('app');
        }}
        onRecuperar={() => setPantalla('recuperar')}
      />
    );
  }

  // ── Pantalla principal ───────────────────────────────────────────────────────
  return (
    <div>
      <nav className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center shadow">
        <div className="flex items-center gap-6">
          <div>
            <span className="font-bold text-lg">HACKTHONYPERU</span>
            <span className="text-blue-300 text-sm ml-2">Sistema de Ventas</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {MENU.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${vista === key ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Badge de alertas de stock */}
          {total > 0 && (
            <button
              onClick={() => setVista('productos')}
              title={alertas.map((a: { nombre: string; stock: number; stock_minimo: number }) =>
                `${a.nombre}: ${a.stock}/${a.stock_minimo}`
              ).join('\n')}
              className="relative flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              Stock bajo
              <span className="bg-red-600 text-white text-xs font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                {total}
              </span>
            </button>
          )}

          <span className="text-sm text-blue-200">
            {usuario?.nombres} —
            <span className="bg-blue-700 px-2 py-0.5 rounded-full text-xs ml-1">
              {usuario?.rol}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {vista === 'clientes' && <Clientes />}
      {vista === 'categorias' && <Categorias />}
      {vista === 'productos' && <Productos />}
      {vista === 'pedidos' && <Pedidos />}
      {vista === 'facturas' && <Facturas />}
      {vista === 'reportes' && <Reportes />}

      {/* Modal de alerta por inactividad — se renderiza sobre todo lo demás */}
      {mostrarAlerta && segundosRestantes !== null && (
        <AlertaInactividad
          segundosRestantes={segundosRestantes}
          onContinuar={handleContinuarSesion}
          onCerrarSesion={handleLogout}
        />
      )}
    </div>
  );
}

export default App;