import { useCallback, useEffect, useRef, useState } from 'react';
import {
  leerMensaje,
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
  const unido = useRef(false);

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
        unido.current = true;
        setEstado({ fase: 'lista', sala: respuesta.data.sala });
        setPresentes(respuesta.data.presentes);
        setMensajes((actuales) => mezclarMensajes(actuales, respuesta.data.historial));
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
      }
      return respuesta;
    } catch {
      return { ok: false, error: { code: 'TIMEOUT', message: MENSAJES_TIEMPO_REAL.TIMEOUT } };
    }
  }, [activar, roomId]);

  const reintentar = useCallback(() => {
    setEstado({ fase: 'uniendo' });
    setIntento((n) => n + 1);
  }, []);

  return { estado, mensajes, presentes, conexion, enviar, reintentar, reconectar };
}
