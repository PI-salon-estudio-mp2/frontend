import googleG from '../../assets/google-g.svg';
import { Button } from '../../components/ui/Button';

interface BotonGoogleProps {
  onClick: () => void;
  cargando: boolean;
}

export function BotonGoogle({ onClick, cargando }: BotonGoogleProps) {
  return (
    <Button
      variant="secondary"
      className="w-full"
      aria-disabled={cargando || undefined}
      onClick={() => {
        if (!cargando) onClick();
      }}
    >
      {/* Decorativo: el texto del botón ya lo nombra para el lector de pantalla. */}
      <img src={googleG} alt="" width={20} height={20} className="size-5" />
      {cargando ? 'Abriendo Google…' : 'Continuar con Google'}
    </Button>
  );
}

/** Separador visual «o» entre el formulario y el botón de Google. */
export function SeparadorO() {
  return (
    <div className="my-6 flex items-center gap-4 text-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span>o</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}