export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});