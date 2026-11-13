import { RUTAS } from '../../routes/rutas';

/** Lee la ruta a la que el usuario quería entrar; solo acepta rutas internas. */
export function leerDestino(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const from = (state as { from: unknown }).from;
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')) {
      return from;
    }
  }
  return RUTAS.panel;
}

const NOMBRES_DESTINO: Record<string, string> = {
  [RUTAS.panel]: '«Mis salas»',
  [RUTAS.perfil]: '«Mi perfil»',
  [RUTAS.crearSala]: '«Crear sala»',
  [RUTAS.unirseSala]: '«Unirme a una sala»',
};

/** Cómo llamar a la página que la persona quería abrir; undefined si llegó directo al login. */
export function nombreDestino(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null || !('from' in state)) return undefined;
  const ruta = leerDestino(state).split(/[?#]/)[0];
  return NOMBRES_DESTINO[ruta] ?? 'la página que querías abrir';
}