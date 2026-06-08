import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Login from '../components/Login';
import * as authService from '../services/authService';

vi.mock('../services/authService', () => ({
  login: vi.fn(),
  guardarSesion: vi.fn(),
  logout: vi.fn(),
  getToken: vi.fn().mockReturnValue(null),
  getUsuario: vi.fn().mockReturnValue(null),
}));

describe('Componente Login - Pruebas Unitarias', () => {
  const mockOnLoginExitoso = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Debe renderizar el título de la empresa', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    expect(screen.getByText('HACKTHONYPERU')).toBeInTheDocument();
  });

  test('Debe mostrar el subtítulo del sistema', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    expect(screen.getByText('Sistema de Ventas S.A.C')).toBeInTheDocument();
  });

  test('Debe mostrar el campo de email', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
  });

  test('Debe mostrar el campo de contraseña', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('Debe mostrar el botón de Ingresar', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  test('Debe permitir escribir en los campos', async () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    await userEvent.type(emailInput, 'admin@hackthony.com');
    await userEvent.type(passwordInput, 'admin123');
    expect(emailInput).toHaveValue('admin@hackthony.com');
    expect(passwordInput).toHaveValue('admin123');
  });

  test('Debe llamar onLoginExitoso al hacer login exitoso', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      mensaje: 'Login exitoso',
      token: 'fake-token',
      usuario: { id: 1, nombres: 'Rodrigo', apellidos: 'Aniceto', email: 'admin@hackthony.com', rol: 'ADMINISTRADOR' }
    });

    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    await userEvent.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'admin@hackthony.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'admin@hackthony.com',
        password: 'admin123'
      });
      expect(mockOnLoginExitoso).toHaveBeenCalled();
    });
  });

  test('Debe mostrar mensaje de error con credenciales incorrectas', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(new Error('Credenciales incorrectas'));

    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    await userEvent.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'mal@correo.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });
});