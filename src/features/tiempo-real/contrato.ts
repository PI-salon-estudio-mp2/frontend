/**
 * Contrato con el servidor de tiempo real (backend-realtime, Socket.IO).
 * Los nombres y datos son los mismos que documenta su README.
 * Toda respuesta (ack) es { ok: true, data } o { ok: false, error: { code, message } }.
 */

export interface UsuarioConectado {
  uid: string;
  username: string;
  avatar: string;
}

export interface SalaEnVivo {
  id: string;
  nombre: string;
  anfitrionUid: string;
  rol: 'administrador' | 'invitado';
}

export interface Mensaje {
  id: string;
  salaId: string;
  /** null si el autor eliminó su cuenta. */
  autorUid: string | null;
  autorUsername: string;
  texto: string;
  /** Fecha ISO 8601 en que el servidor guardó el mensaje. */
  creadoEn: string;
}

export interface SalaUnida {
  sala: SalaEnVivo;
  presentes: UsuarioConectado[];
  historial: Mensaje[];
}

/** Cuántos mensajes trae el servidor por vez (los últimos al entrar y cada «Cargar anteriores»). */
export const LIMITE_HISTORIAL = 50;

/** Respuesta de history:before (US-11): una página de mensajes más viejos. */
export interface HistorialAnterior {
  mensajes: Mensaje[];
  /** true si todavía quedan mensajes más viejos por cargar. */
  hayMas: boolean;
}

export interface Presencia {
  salaId: string;
  presentes: UsuarioConectado[];
}

export interface ErrorTiempoReal {
  code: string;
  message: string;
}

export type Respuesta<T> = { ok: true; data: T } | { ok: false; error: ErrorTiempoReal };

/** Eventos que el servidor envía al cliente. */
export interface EventosServidor {
  'message:new': (mensaje: Mensaje) => void;
  'presence:update': (presencia: Presencia) => void;
  /** Lo emite el servidor cuando el anfitrión elimina la sala (BE, Sprint 3 · US-07). */
  'room:deleted': (datos: { salaId: string }) => void;
}

/** Eventos que el cliente envía al servidor. */
export interface EventosCliente {
  'room:join': (datos: { roomId: string }, ack: (r: Respuesta<SalaUnida>) => void) => void;
  'room:leave': (datos: { roomId: string }, ack: (r: Respuesta<{ salaId: string }>) => void) => void;
  'message:send': (datos: { roomId: string; texto: string }, ack: (r: Respuesta<Mensaje>) => void) => void;
  /** Mensajes anteriores a `antesDe` (ISO), del más viejo al más nuevo (BE, Sprint 3 · US-11). */
  'history:before': (
    datos: { roomId: string; antesDe: string; limite: number },
    ack: (r: Respuesta<HistorialAnterior>) => void,
  ) => void;
  /**
   * US-07 · El anfitrión avisa que ya eliminó la sala con la API. El servidor comprueba en
   * Firestore que no existe y emite room:deleted a quienes estaban dentro (BE, Sprint 3).
   */
  'room:closed': (datos: { roomId: string }, ack: (r: Respuesta<{ salaId: string }>) => void) => void;
}

// ---------- ID de la sala (mismas reglas que backend-api y backend-realtime) ----------

/** Mayúsculas y números sin los que se confunden (0/O, 1/I/L). */
const ALFABETO_ID = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LARGO_ID_SALA = 8;
const ID_REGEX = new RegExp(`^[${ALFABETO_ID}]{${LARGO_ID_SALA}}$`);

/** Recorta espacios (también los de en medio, típicos al pegar) y pasa a mayúsculas. */
export function normalizarIdSala(valor: string): string {
  return valor.replace(/\s+/g, '').toUpperCase();
}

/** Mensaje de error del ID, o undefined si es válido. */
export function errorIdSala(id: string): string | undefined {
  if (!id) return 'Escribe el ID de la sala.';
  if (id.length !== LARGO_ID_SALA) {
    return `El ID tiene ${LARGO_ID_SALA} caracteres (letras y números), por ejemplo K7P2QX9M. Revisa que esté completo.`;
  }
  if (!ID_REGEX.test(id)) {
    return 'El ID solo tiene letras y números, sin 0, O, 1, I ni L. Revisa que lo hayas copiado bien.';
  }
  return undefined;
}

// ---------- Validación de lo que llega del servidor ----------

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '');

export function leerUsuario(valor: unknown): UsuarioConectado | null {
  if (!esObjeto(valor) || !texto(valor.uid)) return null;
  return { uid: texto(valor.uid), username: texto(valor.username), avatar: texto(valor.avatar) };
}

export function leerMensaje(valor: unknown): Mensaje | null {
  if (!esObjeto(valor) || !texto(valor.id) || !texto(valor.salaId) || typeof valor.texto !== 'string') return null;
  return {
    id: texto(valor.id),
    salaId: texto(valor.salaId),
    autorUid: typeof valor.autorUid === 'string' ? valor.autorUid : null,
    autorUsername: texto(valor.autorUsername),
    texto: valor.texto,
    creadoEn: texto(valor.creadoEn),
  };
}

export function leerSalaUnida(valor: unknown): SalaUnida | null {
  if (!esObjeto(valor) || !esObjeto(valor.sala)) return null;
  const s = valor.sala;
  if (!texto(s.id) || (s.rol !== 'administrador' && s.rol !== 'invitado')) return null;
  return {
    sala: { id: texto(s.id), nombre: texto(s.nombre), anfitrionUid: texto(s.anfitrionUid), rol: s.rol },
    presentes: Array.isArray(valor.presentes)
      ? valor.presentes.map(leerUsuario).filter((u): u is UsuarioConectado => u !== null)
      : [],
    historial: Array.isArray(valor.historial)
      ? valor.historial.map(leerMensaje).filter((m): m is Mensaje => m !== null)
      : [],
  };
}

export function leerHistorialAnterior(valor: unknown): HistorialAnterior | null {
  if (!esObjeto(valor) || !Array.isArray(valor.mensajes)) return null;
  return {
    mensajes: valor.mensajes.map(leerMensaje).filter((m): m is Mensaje => m !== null),
    hayMas: valor.hayMas === true,
  };
}

/** Une listas de mensajes sin duplicados (el servidor también reenvía el propio) y en orden. */
export function mezclarMensajes(actuales: Mensaje[], nuevos: Mensaje[]): Mensaje[] {
  if (nuevos.length === 0) return actuales;
  const porId = new Map(actuales.map((m) => [m.id, m]));
  for (const m of nuevos) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn) || a.id.localeCompare(b.id));
}

/** Mensajes en español para los códigos de error del servidor de tiempo real. */
export const MENSAJES_TIEMPO_REAL: Record<string, string> = {
  ROOM_NOT_FOUND: 'No encontramos una sala con ese ID. Revísalo e inténtalo de nuevo.',
  VALIDATION_ERROR: 'Revisa los datos e inténtalo de nuevo.',
  NOT_IN_ROOM: 'Primero tienes que entrar a la sala.',
  UNAUTHORIZED: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  PROFILE_INCOMPLETE: 'Falta elegir tu nombre de usuario para terminar de crear la cuenta.',
  SERVER_UNAVAILABLE: 'El servidor de tiempo real no respondió. Inténtalo de nuevo en unos segundos.',
  TIMEOUT: 'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
  // Sin términos técnicos para el estudiante (#36); el detalle técnico va a la consola.
  SIN_CONFIGURAR: 'El chat no está disponible en este momento. Inténtalo más tarde.',
};

export function mensajeDeError(error: ErrorTiempoReal): string {
  return error.message || MENSAJES_TIEMPO_REAL[error.code] || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
