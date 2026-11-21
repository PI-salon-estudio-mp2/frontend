/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API publicada en Render, sin barra final. Ej.: https://salon-api.onrender.com */
  readonly VITE_API_URL?: string;
  /** Ruta del endpoint de la base técnica (TS-00). Por defecto: /api/base-tecnica */
  readonly VITE_API_DATO_PATH?: string;
  /** URL del servidor de tiempo real (Socket.IO) en Render, sin barra final. */
  readonly VITE_REALTIME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
