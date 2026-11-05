import { useParams } from 'react-router';
import { PaginaPendiente } from './PaginaPendiente';

export function EditarSala() {
  const { id = '' } = useParams();

  return (
    <PaginaPendiente
      titulo="Editar sala"
      descripcion="Cambia el nombre de tu sala o elimínala. Solo el anfitrión puede hacerlo."
      historias="Sprint 3 · US-07"
      sprint={3}
      icono="tool"
      incluira={[
        'Cambiar el nombre de la sala.',
        'Eliminar la sala con una confirmación previa.',
      ]}
    >
      <p className="mt-6 rounded-xl bg-canvas px-4 py-3 text-sm">
        <span className="font-bold">ID de la sala:</span> <code className="break-all">{id}</code>
      </p>
    </PaginaPendiente>
  );
}
