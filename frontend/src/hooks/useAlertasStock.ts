import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../config/api';

interface ProductoAlerta {
  id: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
  categoria_nombre: string;
}

export function useAlertasStock(activo: boolean) {
  const [alertas, setAlertas] = useState<ProductoAlerta[]>([]);
  const [total, setTotal]     = useState(0);

  const fetchAlertas = useCallback(async () => {
    if (!activo) return;
    try {
      const res = await fetch(`${API_BASE_URL}/productos/alertas-stock`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      setAlertas(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      // silencioso
    }
  }, [activo]);

  useEffect(() => {
    fetchAlertas();
    const intervalo = setInterval(fetchAlertas, 60_000);
    return () => clearInterval(intervalo);
  }, [fetchAlertas]);

  return { alertas, total, refetch: fetchAlertas };
}