export const MENSAJE_CREDENCIALES = 'Correo o contraseña incorrectos.';

/** Conflictos de unicidad: un solo texto para registro y perfil. */
export const MENSAJE_USERNAME_EN_USO = 'Ese nombre de usuario ya está en uso. Prueba con otro.';
export const MENSAJE_CORREO_EN_USO = 'Ese correo ya tiene una cuenta. Usa otro correo.';
/** Variante del registro: ahí además se puede iniciar sesión. */
export const MENSAJE_CORREO_EN_USO_REGISTRO = 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.';

/** Traduce los errores de Firebase Authentication a mensajes claros en español. */
export function mensajeErrorAuth(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return MENSAJE_CREDENCIALES;
    case 'auth/too-many-requests':
      return 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Cerraste la ventana de Google antes de terminar. Puedes intentarlo de nuevo.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes de este sitio e inténtalo de nuevo.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con ese correo. Inicia sesión con tu correo y contraseña.';
    default:
      return 'No pudimos iniciar sesión. Inténtalo de nuevo.';
  }
}