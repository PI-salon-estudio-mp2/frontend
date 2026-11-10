import { Icon } from '../../components/ui/Icon';
import { AVATARES } from './avatares';

interface AvatarPickerProps {
  /** Id del primer botón de opción: el resumen de errores le envía el foco. */
  id: string;
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export function AvatarPicker({ id, value, onChange, error }: AvatarPickerProps) {
  const errorId = `${id}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 font-bold text-ink">
        Elige tu avatar<span className="font-normal text-muted"> (obligatorio)</span>
      </legend>
      <div className="flex flex-wrap gap-4">
        {AVATARES.map((a, i) => (
          <label key={a.id} className="group flex w-16 cursor-pointer flex-col items-center gap-1.5">
            <input
              type="radio"
              name="avatar"
              id={i === 0 ? id : `${id}-${a.id}`}
              value={a.id}
              checked={value === a.id}
              onChange={() => onChange(a.id)}
              className="sr-only"
            />
            <span className="relative">
              <span
                className="grid size-14 place-items-center rounded-full text-white outline-offset-4 group-has-[:checked]:ring-4 group-has-[:checked]:ring-ink/80 group-has-[:focus-visible]:outline-3 group-has-[:focus-visible]:outline-primary-600"
                style={{ backgroundColor: a.color }}
              >
                <Icon name="user" className="size-7" />
              </span>
              <span className="absolute -right-1 -bottom-1 hidden size-6 place-items-center rounded-full bg-ink text-white group-has-[:checked]:grid">
                <Icon name="check" className="size-4" />
              </span>
            </span>
            <span className="text-sm font-bold text-ink">{a.nombre}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-sm font-bold text-danger-700">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}