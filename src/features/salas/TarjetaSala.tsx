import { useRef, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { rutaEditarSala, rutaSala } from '../../routes/rutas';
import type { SalaAdministrada } from './api';
import { EliminarSala } from './EliminarSala';

export function TarjetaSala({ sala, notificarCopia, onEliminada }: {
  sala: SalaAdministrada;
  notificarCopia: (id: string | null) => void;
  /** US-07 · El panel quita la sala de la lista apenas la API confirma el borrado. */
  onEliminada?: (sala: SalaAdministrada) => void;
}) {
  const [errorCopia, setErrorCopia] = useState(false);
  const copiando = useRef(false);

  async function copiarId() {
    if (copiando.current) return;
    copiando.current = true;
    setErrorCopia(false);
    try {
      await navigator.clipboard.writeText(sala.id);
      notificarCopia(sala.id);
    } catch {
      setErrorCopia(true);
      notificarCopia(null);
    } finally {
      copiando.current = false;
    }
  }

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="grow">
        <h2 className="wrap-anywhere text-xl font-bold">{sala.nombre}</h2>
        <p className="mt-2 text-sm text-muted">
          <span className="font-bold">ID de la sala:</span>{' '}
          <code className="wrap-anywhere select-all">{sala.id}</code>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to={rutaSala(sala.id)} size="sm" aria-label={`Entrar a ${sala.nombre}`}>
          Entrar
        </ButtonLink>
        <Button variant="secondary" size="sm" onClick={() => void copiarId()} aria-label={`Copiar ID de ${sala.nombre}`}>
          Copiar ID
        </Button>
        <ButtonLink to={rutaEditarSala(sala.id)} variant="secondary" size="sm" aria-label={`Editar nombre de ${sala.nombre}`}>
          Editar nombre
        </ButtonLink>
        {onEliminada && <EliminarSala sala={sala} onEliminada={() => onEliminada(sala)} />}
      </div>
      <div role="alert" aria-atomic="true">
        {errorCopia && (
          <Alert tone="danger" title="No pudimos copiar el ID">
            Vuelve a pulsar «Copiar ID» o selecciona el código y cópialo manualmente.
          </Alert>
        )}
      </div>
    </Card>
  );
}
