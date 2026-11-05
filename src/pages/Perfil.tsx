import { PaginaPendiente } from './PaginaPendiente';

export function Perfil() {
  return (
    <PaginaPendiente
      titulo="Mi perfil"
      descripcion="Consulta y actualiza tus datos personales."
      historias="Sprint 2 · US-04 y US-05"
      sprint={2}
      icono="user"
      incluira={[
        'Ver y editar tu nombre, apellido, avatar y username.',
        'Cancelar los cambios sin guardar.',
        'Eliminar tu cuenta con una confirmación previa.',
      ]}
    />
  );
}
