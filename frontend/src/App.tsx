import { useEffect, useState } from 'react';
import Clientes from './components/Clientes';
import Login from './components/Login';
import Productos from './components/Productos';
import Categorias from './components/Categorias';
import { getToken, getUsuario, logout } from './services/authService';
import type { Usuario } from './services/authService';

type Vista = 'clientes' | 'productos' | 'categorias';

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
            <button
              onClick={() => setVista('clientes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                vista === 'clientes' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setVista('categorias')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                vista === 'categorias' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              Categorías
            </button>
            <button
              onClick={() => setVista('productos')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                vista === 'productos' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              Productos
            </button>
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
    </div>
  );
}

export default App;