import { ApiError } from '../../lib/api';

/**
 * CONTRATO con backend-api (TS-00) — ver Swagger en {VITE_API_URL}/docs
 * --------------------------------------------------------------
 * GET {VITE_API_URL}/api/base-tecnica
 *   Lee el documento Firestore config/base-tecnica (campo «mensaje»).
 *
 * 200 OK   { "data": { "mensaje": "Hola desde Firestore" } }
 * 404      { "error": { "code": "NOT_FOUND",      "message": "..." } }
 * 500      { "error": { "code": "INVALID_DATA",   "message": "..." } }
 * 503      { "error": { "code": "DB_UNAVAILABLE", "message": "..." } }
 *
 * «actualizadoEn» y «fuente» son opcionales: se muestran si el backend los agrega.
 * Si el backend cambia el nombre de un campo, solo se ajusta este archivo.
 */
export interface DatoBase {
  mensaje: string;
  actualizadoEn?: string;
  fuente?: string;
}

const CAMPOS_MENSAJE = ['mensaje', 'message', 'valor', 'value', 'dato', 'texto'] as const;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function parseDatoBase(json: unknown): DatoBase {
  const cuerpo = esObjeto(json) && esObjeto(json.data) ? json.data : json;
  if (!esObjeto(cuerpo)) {
    throw new ApiError('format', 'La respuesta del servidor no tiene el formato esperado.');
  }

  const campo = CAMPOS_MENSAJE.find((nombre) => {
    const v = cuerpo[nombre];
    return typeof v === 'string' || typeof v === 'number';
  });
  if (!campo) {
    throw new ApiError('format', 'La respuesta del servidor no incluye el dato esperado.');
  }

  const actualizado = cuerpo.actualizadoEn ?? cuerpo.updatedAt;
  const fuente = cuerpo.fuente ?? cuerpo.source;

  return {
    mensaje: String(cuerpo[campo]),
    actualizadoEn: typeof actualizado === 'string' ? actualizado : undefined,
    fuente: typeof fuente === 'string' ? fuente : undefined,
  };
}
