import { apiGet, apiRequest, ApiError } from '../../lib/api';

export const MIN_NOMBRE_SALA = 3;
export const MAX_NOMBRE_SALA = 40;
const RUTA_SALAS = '/api/rooms';

export interface SalaAdministrada {
  id: string;
  nombre: string;
  rol: 'administrador';
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function leerSala(valor: unknown): SalaAdministrada {
  if (!esObjeto(valor) || typeof valor.id !== 'string' || !valor.id.trim()
    || typeof valor.nombre !== 'string' || !valor.nombre.trim() || valor.rol !== 'administrador') {
    throw new ApiError('format', 'El servidor no pudo confirmar los datos de la sala.');
  }
  return { id: valor.id, nombre: valor.nombre, rol: valor.rol };
}

function leerDatos(json: unknown): unknown {
  return esObjeto(json) ? json.data : undefined;
}

export function listarSalas(token: string, signal: AbortSignal) {
  return apiGet(RUTA_SALAS, {
    token,
    signal,
    parse: (json) => {
      const datos = leerDatos(json);
      if (!Array.isArray(datos)) {
        throw new ApiError('format', 'El servidor no devolvió una lista de salas válida.');
      }
      return datos.map(leerSala);
    },
  });
}

export function obtenerSala(id: string, token: string, signal: AbortSignal) {
  return apiGet(`${RUTA_SALAS}/${encodeURIComponent(id)}`, {
    token,
    signal,
    parse: (json) => leerSala(leerDatos(json)),
  });
}

/** PATCH /api/rooms/:id — cambia el nombre; solo el anfitrión (403 FORBIDDEN si no lo es). */
export function actualizarSala(id: string, nombre: string, token: string, signal: AbortSignal) {
  return apiRequest(`${RUTA_SALAS}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: { nombre },
    signal,
    parse: (json) => leerSala(leerDatos(json)),
  });
}

/** DELETE /api/rooms/:id — borra la sala y sus mensajes; solo el anfitrión (403 si no lo es). Responde 204. */
export function eliminarSala(id: string, token: string, signal?: AbortSignal) {
  return apiRequest(`${RUTA_SALAS}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
    signal,
    parse: (json) => {
      if (json !== undefined) throw new ApiError('format', 'No pudimos confirmar que la sala se eliminó.');
    },
  });
}

export function crearSala(nombre: string, solicitudId: string, token: string, signal: AbortSignal) {
  return apiRequest(RUTA_SALAS, {
    method: 'POST',
    token,
    body: { nombre, solicitudId },
    signal,
    parse: (json) => leerSala(leerDatos(json)),
  });
}
