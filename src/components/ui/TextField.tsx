import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  obligatorio?: boolean;
  /** Contenido dentro del campo, a la derecha (por ejemplo, «Mostrar contraseña»). */
  adornment?: ReactNode;
}

export function TextField({ id, label, hint, error, obligatorio, adornment, ...rest }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-bold text-ink">
        {label}
        {obligatorio && <span className="font-normal text-muted"> (obligatorio)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mb-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={obligatorio || undefined}
          className={`min-h-11 w-full rounded-xl border bg-surface px-4 text-base text-ink ${
            adornment ? 'pr-36' : ''
          } ${error ? 'border-danger-700 ring-1 ring-danger-700' : 'border-field-border'}`}
          {...rest}
        />
        {adornment && <div className="absolute inset-y-0 right-1 flex items-center">{adornment}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-2 text-sm font-bold text-danger-700">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}