export const POLITICA_CONTRASENA = 'Mínimo 8 caracteres, con al menos una letra y un número.';
export const AYUDA_USERNAME =
  'Entre 3 y 20 caracteres: letras minúsculas, números o guion bajo (_). Sin espacios.';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NOMBRE = 60;

export function normalizarUsername(valor: string): string {
  return valor.trim().toLowerCase();
}

export function validarNombre(valor: string, etiqueta: string): string | undefined {
  const limpio = valor.trim();
  if (!limpio) return `Escribe tus ${etiqueta}.`;
  if (limpio.length > MAX_NOMBRE) return `Usa máximo ${MAX_NOMBRE} caracteres en tus ${etiqueta}.`;
  return undefined;
}

export function validarUsername(valor: string): string | undefined {
  const limpio = normalizarUsername(valor);
  if (!limpio) return 'Elige un nombre de usuario.';
  if (!USERNAME_REGEX.test(limpio)) return `Nombre de usuario no válido. ${AYUDA_USERNAME}`;
  return undefined;
}

export function validarCorreo(valor: string): string | undefined {
  const limpio = valor.trim();
  if (!limpio) return 'Escribe tu correo.';
  if (!CORREO_REGEX.test(limpio)) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  return undefined;
}

export function validarContrasena(valor: string): string | undefined {
  if (!valor) return 'Escribe una contraseña.';
  if (valor.length < 8 || !/[A-Za-z]/.test(valor) || !/\d/.test(valor)) {
    return `La contraseña no cumple la política. ${POLITICA_CONTRASENA}`;
  }
  return undefined;
}

/** Aviso cuando lo escrito cambia al normalizarlo (mayúsculas o espacios en los bordes). */
export function notaUsername(valor: string): string | undefined {
  const normalizado = normalizarUsername(valor);
  if (!normalizado || normalizado === valor || validarUsername(valor)) return undefined;
  return `Se guardará como @${normalizado}`;
}