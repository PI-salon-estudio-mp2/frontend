/** Nombre del producto. Se usa en el encabezado, el pie y el título de cada página. */
export const APP_NAME = 'Salón de Estudio';

/** URL base de la API (Render). Se lee de las variables de entorno, nunca se escribe aquí. */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

/** Endpoint de la base técnica (TS-00): la API lo lee de Firestore. */
export const API_DATO_PATH = import.meta.env.VITE_API_DATO_PATH?.trim() || '/api/base-tecnica';
