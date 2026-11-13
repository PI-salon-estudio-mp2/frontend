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

/** Separador visual entre el botón de Google y el formulario. */
export function SeparadorO({ texto = 'o' }: { texto?: string }) {
  return (
    <div className="my-6 flex items-center gap-4 text-muted">
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
      <span>{texto}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  );
}