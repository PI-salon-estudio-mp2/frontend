import { Spinner } from './Spinner';

export function PantallaCarga({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-24 text-muted"
    >
      <Spinner />
      <span className="font-bold">{texto}</span>
    </div>
  );
}