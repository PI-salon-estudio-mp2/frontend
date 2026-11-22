import { useCallback, useEffect, useRef, useState } from 'react';
import {
  leerHistorialAnterior,
  leerMensaje,
  LIMITE_HISTORIAL,
  mezclarMensajes,
  leerUsuario,
  MENSAJES_TIEMPO_REAL,
  type ErrorTiempoReal,
  type Mensaje,
  type Respuesta,
  type SalaEnVivo,
  type UsuarioConectado,
} from './contrato';
import { ESPERA_RESPUESTA_MS, useTiempoReal } from './TiempoRealContext';

export type EstadoSala =
  | { fase: 'uniendo' }
  | { fase: 'lista'; sala: SalaEnVivo }
  | { fase: 'error'; error: ErrorTiempoReal }
  /** El anfitrión eliminó la sala mientras estábamos dentro. */
  | { fase: 'eliminada' };

/** Estado de «Cargar mensajes anteriores» (US-11). */
export interface EstadoAnteriores {
  hayMas: boolean;
  cargando: boolean;
  error?: string;
}

const ERROR_ANTERIORES = 'No pudimos cargar los mensajes anteriores. Inténtalo de nuevo.';

const sinConexion: ErrorTiempoReal = {
  code: 'DESCONECTADO',
  message: 'Sin conexión con el servidor: tu mensaje no se envió. Inténtalo de nuevo cuando vuelva la conexión.',
};

/**
 * Estado en vivo de una sala: entra con su ID (room:join), recibe los mensajes y la presencia
 * de ESA sala, vuelve a entrar sola si se pierde la conexión y sale (room:leave) al desmontarse.
 */
export function useSalaEnVivo(roomId: string) {
  const { activar, unirse, conexion, reconectar } = useTiempoReal();
  const [estado, setEstado] = useState<EstadoSala>({ fase: 'uniendo' });
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [presentes, setPresentes] = useState<UsuarioConectado[]>([]);
  const [intento, setIntento] = useState(0);
  const [anteriores, setAnteriores] = useState<EstadoAnteriores>({ hayMas: false, cargando: false });
  const unido = useRef(false);
  const mensajesActuales = useRef<Mensaje[]>([]);
  useEffect(() => { mensajesActuales.current = mensajes; }, [mensajes]);

  useEffect(() => {
    let vigente = true;
    unido.current = false;
    const socket = activar();
    if (!socket) {
      setEstado({ fase: 'error', error: { code: 'SIN_CONFIGURAR', message: MENSAJES_TIEMPO_REAL.SIN_CONFIGURAR } });
      return;
    }

    async function entrar() {
      const respuesta = await unirse(roomId);
      if (!vigente) return;
      if (respuesta.ok) {
        const primeraVez = !unido.current;
        unido.current = true;
        setEstado({ fase: 'lista', sala: respuesta.data.sala });
        setPresentes(respuesta.data.presentes);
        setMensajes((actuales) => mezclarMensajes(actuales, respuesta.data.historial));
        // Si llegó la página completa, puede haber mensajes más viejos (historial extenso).
        if (primeraVez) {
          setAnteriores({ hayMas: respuesta.data.historial.length >= LIMITE_HISTORIAL, cargando: false });
        }
        return;
      }
      // Si ya estábamos dentro y solo falló una reconexión, se conserva la sala en pantalla.
      setEstado((actual) => (actual.fase === 'lista' && respuesta.error.code !== 'ROOM_NOT_FOUND'
        ? actual
        : { fase: 'error', error: respuesta.error }));
    }

    // Al volver la conexión el servidor no recuerda las salas del socket anterior: se vuelve a entrar.
    const alReconectar = () => { if (unido.current) void entrar(); };
    const alMensaje = (dato: unknown) => {
      const mensaje = leerMensaje(dato);
      if (mensaje && mensaje.salaId === roomId) setMensajes((actuales) => mezclarMensajes(actuales, [mensaje]));
    };
    const alPresencia = (dato: { salaId?: unknown; presentes?: unknown }) => {
      if (dato?.salaId !== roomId || !Array.isArray(dato.presentes)) return;
      setPresentes(dato.presentes.map(leerUsuario).filter((u): u is UsuarioConectado => u !== null));
    };
    const alEliminar = (dato: { salaId?: unknown }) => {
      if (dato?.salaId === roomId) setEstado({ fase: 'eliminada' });
    };

    socket.on('connect', alReconectar);
    socket.on('message:new', alMensaje);
    socket.on('presence:update', alPresencia);
    socket.on('room:deleted', alEliminar);
    void entrar();

    return () => {
      vigente = false;
      socket.off('connect', alReconectar);
      socket.off('message:new', alMensaje);
      socket.off('presence:update', alPresencia);
      socket.off('room:deleted', alEliminar);
      if (socket.connected && unido.current) socket.emit('room:leave', { roomId }, () => undefined);
    };
  }, [roomId, intento, activar, unirse]);

  /** Envía un mensaje; el servidor lo guarda en Firestore y lo emite solo a esta sala. */
  const enviar = useCallback(async (texto: string): Promise<Respuesta<Mensaje>> => {
    const socket = activar();
    if (!socket?.connected) return { ok: false, error: sinConexion };
    try {
      const respuesta = await socket.timeout(ESPERA_RESPUESTA_MS).emitWithAck('message:send', { roomId, texto });
      if (respuesta.ok) {
        const mensaje = leerMensaje(respuesta.data);
        if (mensaje) setMensajes((actuales) => mezclarMensajes(actuales, [mensaje]));
      } else if (respuesta.error.code === 'ROOM_NOT_FOUND') {
        // El anfitrión eliminó la sala mientras estábamos dentro (US-07).
        setEstado({ fase: 'eliminada' });
      }
      return respuesta;
    } catch {
      return { ok: false, error: { code: 'TIMEOUT', message: MENSAJES_TIEMPO_REAL.TIMEOUT } };
    }
  }, [activar, roomId]);

  /** US-11 · Trae la página anterior al mensaje más viejo que ya está en pantalla. */
  const cargarAnteriores = useCallback(async () => {
    const primero = mensajesActuales.current[0];
    const socket = activar();
    if (!primero || !socket) return;
    if (!socket.connected) {
      setAnteriores((a) => ({ ...a, error: 'Sin conexión con el servidor: no pudimos cargar los mensajes anteriores.' }));
      return;
    }
    setAnteriores((a) => ({ ...a, cargando: true, error: undefined }));
    try {
      const respuesta = await socket
        .timeout(ESPERA_RESPUESTA_MS)
        .emitWithAck('history:before', { roomId, antesDe: primero.creadoEn, limite: LIMITE_HISTORIAL });
      const pagina = respuesta.ok ? leerHistorialAnterior(respuesta.data) : null;
      if (!pagina) {
        setAnteriores((a) => ({ ...a, cargando: false, error: ERROR_ANTERIORES }));
        return;
      }
      setMensajes((actuales) => mezclarMensajes(actuales, pagina.mensajes));
      setAnteriores({ hayMas: pagina.hayMas, cargando: false });
    } catch {
      setAnteriores((a) => ({ ...a, cargando: false, error: ERROR_ANTERIORES }));
    }
  }, [activar, roomId]);

  const reintentar = useCallback(() => {
    setEstado({ fase: 'uniendo' });
    setIntento((n) => n + 1);
  }, []);

  return { estado, mensajes, presentes, conexion, enviar, reintentar, reconectar, anteriores, cargarAnteriores };
}
