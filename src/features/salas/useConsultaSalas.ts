import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { toApiError, type ApiError } from '../../lib/api';

type EstadoConsulta<T> =
  | { status: 'cargando' }
  | { status: 'error'; error: ApiError }
  | { status: 'exito'; datos: T };

export function useConsultaSalas<T>(consultar: (token: string, signal: AbortSignal) => Promise<T>) {
  const { obtenerToken } = useAuth();
  const [estado, setEstado] = useState<EstadoConsulta<T>>({ status: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function cargar() {
      try {
        const token = await obtenerToken();
        if (signal.aborted) return;
        const datos = await consultar(token, signal);
        if (!signal.aborted) setEstado({ status: 'exito', datos });
      } catch (error) {
        if (!signal.aborted) setEstado({ status: 'error', error: toApiError(error) });
      }
    }

    void cargar();
    return () => controller.abort();
  }, [consultar, intento, obtenerToken]);

  function reintentar() {
    setEstado({ status: 'cargando' });
    setIntento((anterior) => anterior + 1);
  }

  return { estado, reintentar };
}
