/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API publicada en Render, sin barra final. Ej.: https://salon-api.onrender.com */
  readonly VITE_API_URL?: string;
  /** Ruta del endpoint de la base técnica (TS-00). Por defecto: /api/base-tecnica */
  readonly VITE_API_DATO_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
