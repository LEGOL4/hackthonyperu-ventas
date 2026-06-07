import { useEffect, useState } from 'react';
import Clientes from './components/Clientes';
import Login from './components/Login';
import Productos from './components/Productos';
import Categorias from './components/Categorias';
import Pedidos from './components/Pedidos';
import { getToken, getUsuario, logout } from './services/authService';
import type { Usuario } from './services/authService';

type Vista = 'clientes' | 'productos' | 'categorias' | 'pedidos';

function App() {
  const [autenticado, setAutenticado] = useState<boolean>(!!getToken());
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vista, setVista] = useState<Vista>('clientes');

  useEffect(() => {
    if (autenticado) setUsuario(getUsuario());
  }, [autenticado]);

  const handleLoginExitoso = () => setAutenticado(true);

  const handleLogout = async () => {
    await logout();
    setAutenticado(false);
    setUsuario(null);
  };

  if (!autenticado) {
    return <Login onLoginExitoso={handleLoginExitoso} />;
  }

  return (
    <div>
      <nav className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center shadow">
        <div className="flex items-center gap-6">
          <div>
            <span className="font-bold text-lg">HACKTHONYPERU</span>
            <span className="text-blue-300 text-sm ml-2">Sistema de Ventas</span>
          </div>
          <div className="flex gap-2">
            {([
              { key: 'clientes', label: 'Clientes' },
              { key: 'categorias', label: 'Categorías' },
              { key: 'productos', label: 'Productos' },
              { key: 'pedidos', label: 'Pedidos' },
            ] as { key: Vista; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  vista === key ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
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
    </div>
  );
}

export default App;