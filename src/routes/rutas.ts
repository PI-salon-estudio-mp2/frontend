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
/** Con `desde: 'sala'`, «Cancelar» y «Guardar nombre» vuelven a la sala en vez de a Mis salas (#41). */
export const rutaEditarSala = (id: string, desde?: 'sala') =>
  `/salas/${encodeURIComponent(id)}/editar${desde === 'sala' ? '?desde=sala' : ''}`;

export interface EnlaceNav {
  to: string;
  label: string;
  end?: boolean;
}

/** Navegación del encabezado para quien aún no inició sesión. */
export const NAV_PUBLICA: EnlaceNav[] = [{ to: RUTAS.inicio, label: 'Inicio', end: true }];

/** Navegación del encabezado con la sesión iniciada. */
export const NAV_PRIVADA: EnlaceNav[] = [
  { to: RUTAS.inicio, label: 'Inicio', end: true },
  { to: RUTAS.panel, label: 'Mis salas' },
  { to: RUTAS.unirseSala, label: 'Unirme a una sala' },
  { to: RUTAS.perfil, label: 'Mi perfil' },
];
