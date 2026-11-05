import { useCallback, useEffect, useState } from 'react';
import { API_DATO_PATH } from '../../config/app';
import { apiGet, toApiError, type ApiError } from '../../lib/api';
import { parseDatoBase, type DatoBase } from './contrato';

export type EstadoDato =
  | { status: 'loading'; lento: boolean }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: DatoBase; consultadoEn: Date };

/** Después de este tiempo se avisa que el servidor puede estar "despertando" (Render gratuito). */
const AVISO_LENTO_MS = 5_000;

/** Pide el dato de la base técnica a la API y expone los estados cargando / error / éxito. */
export function useDatoBase() {
  const [estado, setEstado] = useState<EstadoDato>({ status: 'loading', lento: false });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEstado({ status: 'loading', lento: false });

    const avisoLento = setTimeout(() => {
      setEstado((prev) => (prev.status === 'loading' ? { status: 'loading', lento: true } : prev));
    }, AVISO_LENTO_MS);

    apiGet(API_DATO_PATH, { signal: controller.signal, parse: parseDatoBase })
      .then((data) => setEstado({ status: 'success', data, consultadoEn: new Date() }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return; // La pantalla se desmontó: no hay nada que mostrar.
        setEstado({ status: 'error', error: toApiError(error) });
      })
      .finally(() => clearTimeout(avisoLento));

    return () => {
      clearTimeout(avisoLento);
      controller.abort();
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { estado, reintentar };
}
