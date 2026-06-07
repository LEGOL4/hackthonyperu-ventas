import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Login from '../components/Login';
import { login, guardarSesion } from '../services/authService';

// Mock del servicio de autenticación
vi.mock('../services/authService', () => ({
  login: vi.fn(),
  guardarSesion: vi.fn(),
  getToken: vi.fn(),
  getUsuario: vi.fn(),
  logout: vi.fn()
}));

describe('Componente Login - Pruebas Unitarias', () => {
  const onLoginExitosoMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Debe renderizar los campos del formulario de Login', () => {
    render(<Login onLoginExitoso={onLoginExitosoMock} />);
    
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  test('Debe permitir escribir en los campos de correo y contraseña', async () => {
    render(<Login onLoginExitoso={onLoginExitosoMock} />);
    
    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    await userEvent.type(emailInput, 'usuario@test.com');
    await userEvent.type(passwordInput, 'secreto123');
    
    expect(emailInput).toHaveValue('usuario@test.com');
    expect(passwordInput).toHaveValue('secreto123');
  });

  test('Debe procesar el login exitoso y llamar a onLoginExitoso', async () => {
    const mockResponse = {
      token: 'fake-token-123',
      usuario: { id: 1, nombres: 'Test', apellidos: 'User', email: 'test@user.com', rol: 'ADMIN' }
    };
    vi.mocked(login).mockResolvedValueOnce(mockResponse);

    render(<Login onLoginExitoso={onLoginExitosoMock} />);

    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: 'Ingresar' });

    await userEvent.type(emailInput, 'test@user.com');
    await userEvent.type(passwordInput, 'admin123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'test@user.com', password: 'admin123' });
      expect(guardarSesion).toHaveBeenCalledWith(mockResponse.token, mockResponse.usuario);
      expect(onLoginExitosoMock).toHaveBeenCalled();
    });
  });

  test('Debe mostrar error si las credenciales son incorrectas', async () => {
    const errorMsg = 'Credenciales incorrectas';
    vi.mocked(login).mockRejectedValueOnce(new Error(errorMsg));

    render(<Login onLoginExitoso={onLoginExitosoMock} />);

    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: 'Ingresar' });

    await userEvent.type(emailInput, 'error@test.com');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'error@test.com', password: 'wrongpass' });
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
      expect(onLoginExitosoMock).not.toHaveBeenCalled();
    });
  });

  test('Debe mostrar estado de cargando al enviar el formulario', async () => {
    vi.mocked(login).mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 500)));

    render(<Login onLoginExitoso={onLoginExitosoMock} />);

    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: 'Ingresar' });

    await userEvent.type(emailInput, 'test@user.com');
    await userEvent.type(passwordInput, 'admin123');
    await userEvent.click(submitBtn);

    // Botón debe cambiar de texto e inhabilitarse
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Iniciando sesión...');
  });
});
