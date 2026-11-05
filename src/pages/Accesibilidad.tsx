import { PaginaPendiente } from './PaginaPendiente';

export function Accesibilidad() {
  return (
    <PaginaPendiente
      titulo="Declaración de accesibilidad"
      descripcion="Nuestro compromiso es cumplir las Pautas WCAG 2.2 nivel AA, con foco en personas ciegas que usan lector de pantalla."
      historias="Sprint 6 · US-15"
      sprint={6}
      icono="accessibility"
      incluira={[
        'Conocer el nivel de conformidad con WCAG 2.2 AA y cómo se comprobó.',
        'Ver las limitaciones conocidas y sus alternativas.',
        'Saber a quién reportar una barrera de accesibilidad.',
      ]}
    />
  );
}
