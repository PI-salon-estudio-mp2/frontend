import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export interface ErrorCampo {
  /** Id del campo con el error. */
  id: string;
  mensaje: string;
}

interface FormErrorSummaryProps {
  errores: ErrorCampo[];
  /** Sube en 1 cada vez que se intenta enviar con errores: mueve el foco al resumen. */
  enfoque: number;
}

/** Resumen de errores al inicio del formulario (WCAG 3.3.1): el foco llega aquí al enviar. */
export function FormErrorSummary({ errores, enfoque }: FormErrorSummaryProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (enfoque > 0) ref.current?.focus();
  }, [enfoque]);

  if (errores.length === 0) return null;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby="resumen-errores-titulo"
      className="mb-6 rounded-2xl border border-danger-700/30 bg-danger-50 p-4"
    >
      <h2 id="resumen-errores-titulo" className="flex items-center gap-2 font-bold text-danger-700">
        <Icon name="alert" className="size-5 shrink-0" />
        {errores.length === 1
          ? 'Revisa 1 campo antes de continuar'
          : `Revisa ${errores.length} campos antes de continuar`}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-9 text-ink">
        {errores.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(e.id)?.focus();
              }}
              className="font-bold underline underline-offset-2"
            >
              {e.mensaje}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}