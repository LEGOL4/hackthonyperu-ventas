import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { getToken, getUsuario, logout } from '../services/authService';

// Mock de subcomponentes para aislar App.tsx
vi.mock('../components/Login', () => ({
  default: ({ onLoginExitoso }: { onLoginExitoso: () => void }) => (
    <div>
      <span>Vista Login</span>
      <button onClick={onLoginExitoso}>Simular Login Exitoso</button>
    </div>
  )
}));

vi.mock('../components/Clientes', () => ({
  default: () => <div>Vista Clientes</div>
}));

// Mock del servicio de autenticación
vi.mock('../services/authService', () => ({
  getToken: vi.fn(),
  getUsuario: vi.fn(),
  logout: vi.fn()
}));

describe('Componente App - Pruebas de Flujo y Rutas', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Debe mostrar la pantalla de Login si el usuario no está autenticado', () => {
    vi.mocked(getToken).mockReturnValue(null);
    vi.mocked(getUsuario).mockReturnValue(null);

    render(<App />);

    expect(screen.getByText('Vista Login')).toBeInTheDocument();
    expect(screen.queryByText('Vista Clientes')).not.toBeInTheDocument();
  });

  test('Debe mostrar la pantalla de Clientes si el usuario está autenticado', () => {
    vi.mocked(getToken).mockReturnValue('token-valido');
    vi.mocked(getUsuario).mockReturnValue({
      id: 1,
      nombres: 'Leonardo',
      apellidos: 'García',
      email: 'leo@hack.com',
      rol: 'ADMIN'
    });

    render(<App />);

    expect(screen.getByText('Vista Clientes')).toBeInTheDocument();
    expect(screen.getByText('Leonardo —')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.queryByText('Vista Login')).not.toBeInTheDocument();
  });

  test('Debe cambiar de pantalla al simular login exitoso', async () => {
    vi.mocked(getToken).mockReturnValueOnce(null).mockReturnValue('token-valido');
    vi.mocked(getUsuario).mockReturnValue({
      id: 1,
      nombres: 'Leonardo',
      apellidos: 'García',
      email: 'leo@hack.com',
      rol: 'ADMIN'
    });

    render(<App />);

    expect(screen.getByText('Vista Login')).toBeInTheDocument();

    const loginBtn = screen.getByRole('button', { name: 'Simular Login Exitoso' });
    await userEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByText('Vista Clientes')).toBeInTheDocument();
    });
  });

  test('Debe cerrar sesión y volver al login al hacer clic en Cerrar Sesión', async () => {
    vi.mocked(getToken).mockReturnValue('token-valido');
    vi.mocked(getUsuario).mockReturnValue({
      id: 1,
      nombres: 'Leonardo',
      apellidos: 'García',
      email: 'leo@hack.com',
      rol: 'ADMIN'
    });
    vi.mocked(logout).mockResolvedValueOnce();

    render(<App />);

    expect(screen.getByText('Vista Clientes')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: 'Cerrar sesión' });
    await userEvent.click(logoutBtn);

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(screen.getByText('Vista Login')).toBeInTheDocument();
    });
  });

});
