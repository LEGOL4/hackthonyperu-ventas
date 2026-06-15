import { useEffect, useRef, useCallback, useState } from "react";

interface UseInactividadOptions {
  minutosAlerta?: number;
  minutosLogout?: number;
  onAlerta: () => void;
  onLogout: () => void;
  activo: boolean;
}

export function useInactividad({
  minutosAlerta = 13,
  minutosLogout = 15,
  onAlerta,
  onLogout,
  activo,
}: UseInactividadOptions) {
  const timerAlerta = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerLogout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);

  const limpiarTimers = useCallback(() => {
    if (timerAlerta.current) clearTimeout(timerAlerta.current);
    if (timerLogout.current) clearTimeout(timerLogout.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerAlerta.current = null;
    timerLogout.current = null;
    intervalRef.current = null;
    setSegundosRestantes(null);
  }, []);

  const reiniciarContador = useCallback(() => {
    if (!activo) return;
    limpiarTimers();

    const msAlerta = minutosAlerta * 60 * 1000;
    const msAviso  = (minutosLogout - minutosAlerta) * 60 * 1000;

    timerAlerta.current = setTimeout(() => {
      const totalSegs = Math.round(msAviso / 1000);
      setSegundosRestantes(totalSegs);
      onAlerta();

      let segs = totalSegs;
      intervalRef.current = setInterval(() => {
        segs -= 1;
        setSegundosRestantes(segs);
        if (segs <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      }, 1000);

      timerLogout.current = setTimeout(() => {
        limpiarTimers();
        onLogout();
      }, msAviso);
    }, msAlerta);
  }, [activo, minutosAlerta, minutosLogout, onAlerta, onLogout, limpiarTimers]);

  useEffect(() => {
    if (!activo) {
      limpiarTimers();
      return;
    }

    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    let ultimo = Date.now();
    const handleActividad = () => {
      const ahora = Date.now();
      if (ahora - ultimo < 500) return;
      ultimo = ahora;
      reiniciarContador();
    };

    eventos.forEach((e) => window.addEventListener(e, handleActividad));
    reiniciarContador();

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, handleActividad));
      limpiarTimers();
    };
  }, [activo, reiniciarContador, limpiarTimers]);

  return { segundosRestantes, reiniciarContador };
}