import { PaginaPendiente } from './PaginaPendiente';

export function Panel() {
  return (
    <PaginaPendiente
      titulo="Mis salas"
      descripcion="Tu panel con las salas que has creado."
      historias="Sprint 2 · US-06"
      sprint={2}
      icono="home"
      incluira={[
        'Ver la lista de tus salas con su nombre y su ID.',
        'Copiar el ID de una sala para invitar a otras personas.',
        'Crear una sala nueva o unirte a otra con su código.',
      ]}
    />
  );
}
