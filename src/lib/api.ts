import { API_URL } from '../config/app';

export type ApiErrorKind = 'config' | 'network' | 'timeout' | 'http' | 'format';

/** Error normalizado de la API, con un mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Código de error de backend-api, por ejemplo «DB_UNAVAILABLE». */
  readonly code?: string;
  /** Mensajes por campo cuando el servidor rechaza un formulario (400 VALIDATION_ERROR). */
  readonly fields?: Record<string, string>;

  constructor(
    kind: ApiErrorKind,
    message: string,
    status?: number,
    code?: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Mensajes para los códigos que documenta backend-api (Swagger / README). */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  NOT_FOUND: 'Todavía no hay un dato guardado en la base de datos.',
  ROUTE_NOT_FOUND: 'La dirección del servicio no existe. Revisa la configuración de la aplicación.',
  INVALID_DATA: 'El dato guardado en la base de datos no tiene el formato correcto.',
  DB_UNAVAILABLE: 'El servidor no pudo conectarse con la base de datos. Inténtalo de nuevo en unos segundos.',
  INTERNAL_ERROR: 'El servidor tuvo un problema al procesar la solicitud.',
  USERNAME_TAKEN: 'Ese nombre de usuario ya está ocupado. Prueba con otro.',
  EMAIL_TAKEN: 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.',
  VALIDATION_ERROR: 'Revisa los datos del formulario e inténtalo de nuevo.',
  UNAUTHORIZED: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
};

function mensajeHttp(status: number, code?: string): string {
  if (code && MENSAJES_POR_CODIGO[code]) return MENSAJES_POR_CODIGO[code];
  if (status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para ver esta información.';
  if (status === 404) return 'El servidor no encontró la información solicitada.';
  if (status >= 500) return 'El servidor tuvo un problema al procesar la solicitud.';
  return 'El servidor no pudo responder a la solicitud.';
}

interface CuerpoError {
  code?: string;
  fields?: Record<string, string>;
}

/** Lee { "error": { "code", "fields" } } del cuerpo de una respuesta con error. */
async function leerCuerpoError(response: Response): Promise<CuerpoError> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'error' in body) {
      const error = (body as { error: unknown }).error;
      if (typeof error === 'object' && error !== null) {
        const { code, fields } = error as { code?: unknown; fields?: unknown };
        const campos: Record<string, string> = {};
        if (typeof fields === 'object' && fields !== null) {
          for (const [nombre, mensaje] of Object.entries(fields)) {
            if (typeof mensaje === 'string') campos[nombre] = mensaje;
          }
        }
        return {
          code: typeof code === 'string' ? code : undefined,
          fields: Object.keys(campos).length > 0 ? campos : undefined,
        };
      }
    }
  } catch {
    // El cuerpo no es JSON: nos quedamos con el código HTTP.
  }
  return {};
}

interface ApiRequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Cuerpo JSON de la petición. */
  body?: unknown;
  /** ID token de Firebase: se envía como «Authorization: Bearer». */
  token?: string;
  /** Permite cancelar la petición (por ejemplo, al salir de la pantalla). */
  signal?: AbortSignal;
  /**
   * Tiempo máximo de espera. Render (plan gratuito) "duerme" el servicio y el
   * primer arranque puede tardar cerca de un minuto, por eso el valor es alto.
   */
  timeoutMs?: number;
  /** Valida y transforma el JSON recibido. Debe lanzar ApiError('format') si no sirve. */
  parse: (json: unknown) => T;
}

/**
 * Petición a la API publicada. Todo dato del producto pasa por aquí:
 * el frontend NUNCA consulta Firestore directamente.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions<T>): Promise<T> {
  const { method = 'GET', body, token, signal, timeoutMs = 70_000, parse } = options;

  if (!API_URL) {
    throw new ApiError(
      'config',
      'La aplicación no tiene configurada la dirección de la API (variable VITE_API_URL).',
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new ApiError(
          'timeout',
          'El servidor tardó demasiado en responder. Inténtalo de nuevo en unos segundos.',
        );
      }
      if (signal?.aborted) throw error; // Cancelación intencional: quien llama la ignora.
      throw new ApiError(
        'network',
        'No pudimos conectarnos con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.',
      );
    }

    if (!response.ok) {
      const { code, fields } = await leerCuerpoError(response);
      throw new ApiError('http', mensajeHttp(response.status, code), response.status, code, fields);
    }

    if (response.status === 204) return parse(undefined);

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new ApiError('format', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return parse(json);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** GET a la API publicada. */
export function apiGet<T>(
  path: string,
  options: Omit<ApiRequestOptions<T>, 'method' | 'body'>,
): Promise<T> {
  return apiRequest(path, { ...options, method: 'GET' });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('network', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
}