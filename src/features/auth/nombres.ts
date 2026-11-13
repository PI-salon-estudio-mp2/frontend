/** Algunas cuentas de Google entregan el nombre TODO EN MAYÚSCULAS; se muestra como nombre propio. */
export function nombrePropio(valor: string): string {
  const limpio = valor.trim();
  const esTodoMayusculas =
    limpio === limpio.toLocaleUpperCase('es') && limpio !== limpio.toLocaleLowerCase('es');
  if (!esTodoMayusculas) return limpio;
  return limpio
    .toLocaleLowerCase('es')
    .replace(/(^|\s)(\p{L})/gu, (_, espacio: string, letra: string) => espacio + letra.toLocaleUpperCase('es'));
}