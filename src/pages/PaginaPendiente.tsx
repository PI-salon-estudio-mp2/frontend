import type { ReactNode } from 'react';
import { ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

interface PaginaPendienteProps {
  titulo: string;
  descripcion: string;
  /** Historias que construyen esta pantalla, por ejemplo «US-03». */
  historias: string;
  sprint: number;
  icono: IconName;
  /** Lo que tendrá la pantalla cuando se implemente (tomado de los criterios de aceptación). */
  incluira: string[];
  children?: ReactNode;
}

/**
 * Plantilla para las rutas del mapa del sitio que se construyen en sprints
 * posteriores. Mantiene la estructura y la guía visual desde el Sprint 0.
 */
export function PaginaPendiente({
  titulo,
  descripcion,
  historias,
  sprint,
  icono,
  incluira,
  children,
}: PaginaPendienteProps) {
  usePageTitle(titulo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader eyebrow={historias} title={titulo} description={descripcion} />

      <Card className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon name={icono} className="size-8" />
        </span>
        <div>
          <h2 className="text-xl font-bold">Esta pantalla llega en el Sprint {sprint}</h2>
          <p className="mt-2 text-muted">
            La ruta ya existe y forma parte del mapa del sitio. Cuando esté lista podrás:
          </p>
          <ul className="mt-4 space-y-2">
            {incluira.map((item) => (
              <li key={item} className="flex gap-3">
                <Icon name="check" className="mt-1 size-5 shrink-0 text-success-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {children}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={RUTAS.inicio} variant="secondary">
              <Icon name="arrowLeft" />
              Volver al inicio
            </ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  );
}
