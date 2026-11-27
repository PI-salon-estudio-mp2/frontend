import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io } from 'socket.io-client';
import { TiempoRealContext, type Conexion, type SocketApp, type TiempoRealValue } from './contexto';
import { REALTIME_URL } from '../../config/app';
import { auth } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import {
  leerSalaUnida,
  MENSAJES_TIEMPO_REAL,
  type ErrorTiempoReal,
  type Respuesta,
  type SalaUnida,
} from './contrato';

export type { Conexion, EstadoConexion, SocketApp, TiempoRealValue } from './contexto';
export { useTiempoRealOpcional } from './contexto';

/** Primer arranque de Render (plan gratuito) más un margen. */
const ESPERA_CONEXION_MS = 70_000;
/** Tiempo máximo para que el servidor responda un evento. */
export const ESPERA_RESPUESTA_MS = 15_000;
/** Errores del handshake que no se arreglan reintentando solos. */
const ERRORES_DEFINITIVOS = new Set(['UNAUTHORIZED', 'PROFILE_INCOMPLETE']);

const error = (code: string, message = MENSAJES_TIEMPO_REAL[code] ?? ''): ErrorTiempoReal => ({ code, message });

function codigoDe(err: unknown): string | undefined {
  const data = (err as { data?: { code?: unknown } } | null)?.data;
  return typeof data?.code === 'string' ? data.code : undefined;
}

/** Espera a que el socket esté conectado; falla si el servidor rechaza la conexión de forma definitiva. */
function esperarConexion(socket: SocketApp): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const limpiar = () => {
      clearTimeout(timer);
      socket.off('connect', alConectar);
      socket.off('connect_error', alFallar);
    };
    const alConectar = () => { limpiar(); resolve(); };
    const alFallar = (err: Error) => {
      const code = codigoDe(err);
      if (code && ERRORES_DEFINITIVOS.has(code) && !socket.active) {
        limpiar();
        reject(error(code, err.message));
      }
    };
    const timer = setTimeout(() => { limpiar(); reject(error('TIMEOUT')); }, ESPERA_CONEXION_MS);
    socket.on('connect', alConectar);
    socket.on('connect_error', alFallar);
  });
}

/**
 * Una sola conexión de Socket.IO por sesión, compartida por las pantallas de salas.
 * Se crea la primera vez que una pantalla la necesita y se cierra al cerrar sesión.
 * El ID token se pide en cada intento de conexión, así al reconectar siempre va uno vigente.
 */
export function TiempoRealProvider({ children }: { children: ReactNode }) {
  const { estado } = useAuth();
  const uid = estado.status === 'autenticado' ? estado.user.uid : null;
  const socketRef = useRef<SocketApp | null>(null);
  const tokenRenovado = useRef(false);
  const avisoConfiguracion = useRef(false);
  const reintento = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [conexion, setConexion] = useState<Conexion>({ estado: 'inactivo' });

  // Al cambiar de usuario (o cerrar sesión) se cierra la conexión anterior.
  useEffect(() => () => {
    clearTimeout(reintento.current);
    socketRef.current?.removeAllListeners();
    socketRef.current?.io.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConexion({ estado: 'inactivo' });
  }, [uid]);

  const activar = useCallback((): SocketApp | null => {
    if (!REALTIME_URL) {
      if (!avisoConfiguracion.current) {
        avisoConfiguracion.current = true;
        console.error('Falta la variable de entorno VITE_REALTIME_URL: no se puede conectar con el servidor de tiempo real.');
      }
      setConexion({ estado: 'error', error: error('SIN_CONFIGURAR') });
      return null;
    }
    const existente = socketRef.current;
    if (existente) {
      if (!existente.connected && !existente.active) existente.connect();
      return existente;
    }

    const socket: SocketApp = io(REALTIME_URL, {
      autoConnect: false,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 8_000,
      auth: (cb) => {
        const user = auth.currentUser;
        if (!user) return cb({});
        user.getIdToken(tokenRenovado.current).then((token) => cb({ token }), () => cb({}));
      },
    });

    socket.on('connect', () => {
      tokenRenovado.current = false;
      setConexion({ estado: 'conectado' });
    });
    socket.on('disconnect', (motivo) => {
      setConexion(motivo === 'io client disconnect' ? { estado: 'inactivo' } : { estado: 'reconectando' });
    });
    socket.io.on('reconnect_attempt', () => setConexion({ estado: 'reconectando' }));
    socket.on('connect_error', (err) => {
      const code = codigoDe(err);
      if (socket.active) {
        // Error de red: Socket.IO sigue reintentando solo.
        setConexion((actual) => ({ estado: actual.estado === 'conectando' ? 'conectando' : 'reconectando' }));
        return;
      }
      if (code === 'UNAUTHORIZED' && !tokenRenovado.current) {
        // El token pudo vencer justo ahora: se pide uno nuevo una sola vez.
        tokenRenovado.current = true;
        socket.connect();
        return;
      }
      if (code && ERRORES_DEFINITIVOS.has(code)) {
        setConexion({ estado: 'error', error: error(code, err.message) });
        return;
      }
      // SERVER_UNAVAILABLE u otro rechazo temporal: se reintenta en unos segundos.
      setConexion({ estado: 'reconectando' });
      clearTimeout(reintento.current);
      reintento.current = setTimeout(() => socket.connect(), 3_000);
    });

    socketRef.current = socket;
    setConexion({ estado: 'conectando' });
    socket.connect();
    return socket;
  }, []);

  const reconectar = useCallback(() => {
    tokenRenovado.current = false;
    const socket = activar();
    if (socket && !socket.connected) {
      setConexion({ estado: 'conectando' });
      socket.connect();
    }
  }, [activar]);

  const unirse = useCallback(async (roomId: string): Promise<Respuesta<SalaUnida>> => {
    const socket = activar();
    if (!socket) return { ok: false, error: error('SIN_CONFIGURAR') };
    try {
      await esperarConexion(socket);
    } catch (e) {
      return { ok: false, error: e as ErrorTiempoReal };
    }
    try {
      const respuesta = await socket.timeout(ESPERA_RESPUESTA_MS).emitWithAck('room:join', { roomId });
      if (!respuesta.ok) return respuesta;
      const datos = leerSalaUnida(respuesta.data);
      return datos ? { ok: true, data: datos } : { ok: false, error: error('SERVER_UNAVAILABLE') };
    } catch {
      return { ok: false, error: error('TIMEOUT') };
    }
  }, [activar]);

  const avisarSalaEliminada = useCallback((roomId: string) => {
    const socket = activar();
    if (!socket) return;
    // Mejor esfuerzo: si falla, los participantes igual se enteran al intentar enviar un mensaje.
    void esperarConexion(socket)
      .then(() => socket.timeout(ESPERA_RESPUESTA_MS).emitWithAck('room:closed', { roomId }))
      .catch(() => undefined);
  }, [activar]);

  const valor = useMemo(
    () => ({ conexion, activar, unirse, reconectar, avisarSalaEliminada }),
    [conexion, activar, unirse, reconectar, avisarSalaEliminada],
  );
  return <TiempoRealContext.Provider value={valor}>{children}</TiempoRealContext.Provider>;
}

export function useTiempoReal(): TiempoRealValue {
  const valor = useContext(TiempoRealContext);
  if (!valor) throw new Error('useTiempoReal debe usarse dentro de <TiempoRealProvider>');
  return valor;
}
