/**
 * MAPA DEL SITIO — una sola fuente de verdad para las rutas.
 * La navegación, el pie de página y App.tsx leen de aquí.
 */
export const RUTAS = {
  inicio: '/',
  ingresar: '/ingresar',
  registro: '/registro',
  elegirUsername: '/registro/username',
  panel: '/dashboard',
  perfil: '/perfil',
  crearSala: '/salas/nueva',
  unirseSala: '/salas/unirse',
  sala: '/salas/:id',
  editarSala: '/salas/:id/editar',
  accesibilidad: '/accesibilidad',
} as const;

export const rutaSala = (id: string) => `/salas/${encodeURIComponent(id)}`;
export const rutaEditarSala = (id: string) => `/salas/${encodeURIComponent(id)}/editar`;

export interface EnlaceNav {
  to: string;
  label: string;
  end?: boolean;
}

/** Navegación principal del encabezado. */
export const NAV_PRINCIPAL: EnlaceNav[] = [
  { to: RUTAS.inicio, label: 'Inicio', end: true },
  { to: RUTAS.panel, label: 'Mis salas' },
  { to: RUTAS.unirseSala, label: 'Unirme a una sala' },
  { to: RUTAS.perfil, label: 'Mi perfil' },
];
