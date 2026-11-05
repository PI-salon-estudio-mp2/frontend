import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Texto pequeño sobre el título (por ejemplo, la historia de usuario). */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/**
 * Encabezado de cada pantalla. El <h1> recibe el foco al cambiar de ruta
 * (ver Layout), así el lector de pantalla anuncia la página nueva.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-sm font-bold tracking-wide text-primary-700 uppercase">{eyebrow}</p>
        )}
        <h1 tabIndex={-1} className="text-3xl leading-tight font-bold text-ink outline-none sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-3 text-lg text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
