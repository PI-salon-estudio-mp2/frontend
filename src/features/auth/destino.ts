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