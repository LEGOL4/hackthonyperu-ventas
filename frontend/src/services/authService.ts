import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/auth`;

export interface LoginData {
  email: string;
  password: string;
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export const login = async (data: LoginData): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.mensaje || 'Error al iniciar sesión');
  }

  return res.json();
};

export const logout = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUsuario = (): Usuario | null => {
  const u = localStorage.getItem('usuario');
  return u ? JSON.parse(u) : null;
};

export const guardarSesion = (token: string, usuario: Usuario): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
};
