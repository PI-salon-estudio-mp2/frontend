import { useEffect, useState, type CSSProperties } from 'react';
import { Icon } from '../../components/ui/Icon';

const DURACION_AVISO_MS = 6000;

/** Mismo aviso al renombrar, se vuelva a Mis salas o a la sala (#41). */
export function avisoNombreActualizado(nombre: string) {
  return { titulo: 'Nombre actualizado', mensaje: `La sala ahora se llama «${nombre}».` };
}

/** Mismo aviso al copiar el ID en Mis salas y dentro de la sala (#40). */
export function avisoIdCopiado(id: string) {
  return { titulo: 'ID copiado', mensaje: `Copiaste el código ${id}. Compártelo con tu grupo para invitarlos.` };
}
const estiloAviso = { '--duracion-aviso': `${DURACION_AVISO_MS}ms` } as CSSProperties;

interface AvisoExitoSalaProps {
  aviso?: { titulo: string; mensaje: string };
  version?: number;
}

export function AvisoExitoSala({ aviso, version = 0 }: AvisoExitoSalaProps) {
  const titulo = aviso?.titulo;
  const [versionOculta, setVersionOculta] = useState<number>();

  useEffect(() => {
    if (!titulo) return;
    const temporizador = window.setTimeout(() => setVersionOculta(version), DURACION_AVISO_MS);
    return () => window.clearTimeout(temporizador);
  }, [titulo, version]);

  return (
    <div role="status" aria-atomic="true">
      {aviso && versionOculta !== version && (
        <div
          key={version}
          className="animar-aviso-exito pointer-events-none fixed right-4 bottom-4 z-40 flex min-h-[110px] w-[358px] max-w-[calc(100%_-_2rem)] items-start gap-3 rounded-2xl border border-success-border bg-success-50 p-4"
          style={estiloAviso}
        >
          <Icon name="check" className="mt-0.5 size-5 shrink-0 text-success-700" />
          <div className="min-w-0">
            <p className="font-bold text-ink">{aviso.titulo}</p>
            <p className="mt-1 wrap-anywhere text-sm/5 text-muted">{aviso.mensaje}</p>
          </div>
        </div>
      )}
    </div>
  );
}
