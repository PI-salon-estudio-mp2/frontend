import { PaginaPendiente } from './PaginaPendiente';

export function CrearSala() {
  return (
    <PaginaPendiente
      titulo="Crear una sala"
      descripcion="Abre un espacio privado de estudio para tu grupo."
      historias="Sprint 2 · US-06"
      sprint={2}
      icono="plus"
      incluira={[
        'Darle un nombre a tu sala y recibir un ID único.',
        'Entrar a la sala como anfitrión al crearla.',
      ]}
    />
  );
}
