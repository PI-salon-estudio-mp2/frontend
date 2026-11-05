import { PaginaPendiente } from './PaginaPendiente';

export function UnirseSala() {
  return (
    <PaginaPendiente
      titulo="Unirme a una sala"
      descripcion="Escribe el código que te compartió el anfitrión."
      historias="Sprint 3 · US-08"
      sprint={3}
      icono="door"
      incluira={[
        'Ingresar el ID de una sala y entrar a la sesión.',
        'Recibir un aviso claro si la sala no existe.',
        'Entrar directamente desde un enlace de invitación.',
      ]}
    />
  );
}
