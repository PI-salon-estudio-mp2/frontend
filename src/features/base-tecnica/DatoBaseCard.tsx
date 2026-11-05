import { useRef } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Spinner } from '../../components/ui/Spinner';
import { useDatoBase, type EstadoDato } from './useDatoBase';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const formatoHora = new Intl.DateTimeFormat('es-CO', { timeStyle: 'medium' });

function fechaLegible(iso?: string) {
  if (!iso) return undefined;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? undefined : formatoFecha.format(fecha);
}

/** Texto que escucha el lector de pantalla en cada estado (región viva persistente). */
function anuncio(estado: EstadoDato): string {
  switch (estado.status) {
    case 'loading':
      return estado.lento ? 'El servidor se está activando, la carga puede tardar un poco más.' : 'Cargando el dato.';
    case 'error':
      return `No pudimos cargar el dato. ${estado.error.message}`;
    case 'success':
      return `Dato cargado: ${estado.data.mensaje}`;
  }
}

/**
 * TS-00 · Muestra un dato que viene de Firestore A TRAVÉS de la API publicada.
 * Estados: cargando, error (con «Reintentar») y éxito.
 */
export function DatoBaseCard() {
  const { estado, reintentar } = useDatoBase();
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const onReintentar = () => {
    // El botón desaparece mientras carga: dejamos el foco en el título de la tarjeta.
    tituloRef.current?.focus();
    reintentar();
  };

  return (
    <Card aria-labelledby="dato-base-titulo" aria-busy={estado.status === 'loading'} role="region">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
          <Icon name="database" />
        </span>
        <div>
          <h2 id="dato-base-titulo" ref={tituloRef} tabIndex={-1} className="text-lg font-bold outline-none">
            Mensaje del día
          </h2>
          <p className="text-sm text-muted">Leído desde Firestore a través de la API</p>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {anuncio(estado)}
      </p>

      <div className="mt-6 min-h-36">
        {estado.status === 'loading' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-muted">
              <Spinner />
              <span className="font-bold">Cargando el dato…</span>
            </div>
            <div className="space-y-3" aria-hidden="true">
              <div className="h-5 w-4/5 animate-pulse rounded-full bg-line" />
              <div className="h-5 w-3/5 animate-pulse rounded-full bg-line" />
            </div>
            {estado.lento && (
              <Alert tone="warning" title="El servidor se está activando">
                El servicio gratuito se suspende cuando no se usa. La primera carga puede tardar hasta un
                minuto.
              </Alert>
            )}
          </div>
        )}

        {estado.status === 'error' && (
          <Alert
            tone="danger"
            title="No pudimos cargar el dato"
            actions={
              <Button onClick={onReintentar}>
                <Icon name="refresh" />
                Reintentar
              </Button>
            }
          >
            <p>{estado.error.message}</p>
            {estado.error.status && (
              <p className="mt-1 text-sm">
                Código de respuesta: {estado.error.status}
                {estado.error.code && ` · ${estado.error.code}`}
              </p>
            )}
          </Alert>
        )}

        {estado.status === 'success' && (
          <div>
            <p className="text-2xl leading-snug font-bold break-words text-ink sm:text-3xl">
              {estado.data.mensaje}
            </p>
            <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-ink">Fuente</dt>
                <dd className="text-muted">{estado.data.fuente ?? 'Firestore · config/base-tecnica'}</dd>
              </div>
              {fechaLegible(estado.data.actualizadoEn) && (
                <div>
                  <dt className="font-bold text-ink">Actualizado</dt>
                  <dd className="text-muted">{fechaLegible(estado.data.actualizadoEn)}</dd>
                </div>
              )}
              <div>
                <dt className="font-bold text-ink">Consultado a las</dt>
                <dd className="text-muted">{formatoHora.format(estado.consultadoEn)}</dd>
              </div>
            </dl>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-success-50 px-3 py-1 text-sm font-bold text-success-700">
              <Icon name="check" className="size-4" />
              Conexión con la API activa
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
