const HORA = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' });
const FECHA_HORA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const COMPLETA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' });

function mismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** «3:05 p. m.» si es de hoy; «20 nov, 3:05 p. m.» si es de otro día. */
export function horaMensaje(iso: string, ahora = new Date()): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return mismoDia(fecha, ahora) ? HORA.format(fecha) : FECHA_HORA.format(fecha);
}

/** Fecha completa para el atributo title (al pasar el mouse). */
export function fechaCompleta(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? '' : COMPLETA.format(fecha);
}
