import { PaginaPendiente } from './PaginaPendiente';

export function ElegirUsername() {
  return (
    <PaginaPendiente
      titulo="Elige tu nombre de usuario"
      descripcion="Último paso del registro con Google: así te verán los demás en las salas."
      historias="Sprint 1 · US-02"
      sprint={1}
      icono="user"
      incluira={[
        'Elegir un username único validado por el servidor.',
        'Recibir un aviso claro si el username está ocupado o no es válido.',
        'Entrar a tu panel al completar el perfil.',
      ]}
    />
  );
}
