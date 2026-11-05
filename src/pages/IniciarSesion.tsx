import { PaginaPendiente } from './PaginaPendiente';

export function IniciarSesion() {
  return (
    <PaginaPendiente
      titulo="Iniciar sesión"
      descripcion="Entra con tu correo y contraseña o con tu cuenta de Google."
      historias="Sprint 1 · US-03"
      sprint={1}
      icono="door"
      incluira={[
        'Iniciar sesión con correo y contraseña.',
        'Continuar con Google sin volver a elegir username.',
        'Volver a la página que intentabas abrir después de ingresar.',
      ]}
    />
  );
}
