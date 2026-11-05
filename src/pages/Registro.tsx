import { PaginaPendiente } from './PaginaPendiente';

export function Registro() {
  return (
    <PaginaPendiente
      titulo="Crear cuenta"
      descripcion="Regístrate con tus datos o con Google para empezar a estudiar en grupo."
      historias="Sprint 1 · US-01 y US-02"
      sprint={1}
      icono="user"
      incluira={[
        'Registrarte con nombres, apellidos, username único, avatar, correo y contraseña.',
        'Ver junto a cada campo cómo corregir un error, sin perder lo escrito.',
        'Registrarte con Google y elegir tu username.',
      ]}
    />
  );
}
