import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { ErrorTiempoReal, EventosCliente, EventosServidor, Respuesta, SalaUnida } from './contrato';

/*
 * Contexto y tipos de la conexión en tiempo real, separados del proveedor para que los
 * componentes que solo lo consultan (por ejemplo, EliminarSala) no carguen Firebase.
 */

export type SocketApp = Socket<EventosServidor, EventosCliente>;

/**
 * conectando: primer intento (Render puede tardar ~1 min en despertar).
 * reconectando: se perdió la conexión y Socket.IO reintenta solo.
 * error: el servidor rechazó la conexión (sin sesión, sin perfil o sin configurar).
 */
export type EstadoConexion = 'inactivo' | 'conectando' | 'conectado' | 'reconectando' | 'error';

export interface Conexion {
  estado: EstadoConexion;
  error?: ErrorTiempoReal;
}

export interface TiempoRealValue {
  conexion: Conexion;
  /** Devuelve el socket y lo conecta si aún no lo está (null si falta VITE_REALTIME_URL). */
  activar: () => SocketApp | null;
  /** Espera la conexión (hasta ~70 s) y entra a la sala validando su ID en el servidor. */
  unirse: (roomId: string) => Promise<Respuesta<SalaUnida>>;
  /** Vuelve a intentar la conexión después de un error. */
  reconectar: () => void;
  /** US-07 · Avisa al servidor que el anfitrión eliminó la sala (no bloquea si falla). */
  avisarSalaEliminada: (roomId: string) => void;
}

export const TiempoRealContext = createContext<TiempoRealValue | null>(null);

/** Igual que useTiempoReal, pero devuelve null fuera del proveedor (por ejemplo, en pruebas). */
export function useTiempoRealOpcional(): TiempoRealValue | null {
  return useContext(TiempoRealContext);
}
