import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { useAuth } from '../features/auth/AuthContext';
import { AvisoExitoSala } from '../features/salas/AvisoExitoSala';
import { mensajeDeError, normalizarIdSala, type SalaEnVivo } from '../features/tiempo-real/contrato';
import { EstadoConexion } from '../features/tiempo-real/EstadoConexion';
import { useSalaEnVivo } from '../features/tiempo-real/useSalaEnVivo';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

export function Sala() {
  const { id = '' } = useParams();
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;
  const roomId = normalizarIdSala(id);
  return <InteriorSala key={`${estado.user.uid}:${roomId}`} id={roomId} />;
}

/** Interior de la sala (US-08): se entra validando el ID en el servidor de tiempo real. */
function InteriorSala({ id }: { id: string }) {
  const { estado, conexion, reintentar, reconectar } = useSalaEnVivo(id);
  const { state } = useLocation();
  const titulo = estado.fase === 'lista' ? estado.sala.nombre : 'Sala de estudio';
  usePageTitle(titulo);

  const salirDeLaSala = (
    <ButtonLink variant="secondary" to={RUTAS.panel}>
      <Icon name="arrowLeft" />
      Salir de la sala
    </ButtonLink>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title={titulo} actions={salirDeLaSala} />

      {estado.fase === 'lista' && <EstadoConexion conexion={conexion} onReintentar={reconectar} />}
      <AvisoExitoSala
        aviso={estado.fase === 'lista' && state?.salaCreada === id
          ? { titulo: 'Sala creada', mensaje: 'Comparte el ID para que tu grupo pueda entrar.' }
          : undefined}
      />

      {estado.fase === 'uniendo' && (
        <>
          <EstadoConexion conexion={conexion} onReintentar={reconectar} />
          {conexion.estado !== 'error' && <PantallaCarga texto="Entrando a la sala…" />}
        </>
      )}

      <div role="alert">
        {estado.fase === 'error' && (estado.error.code === 'ROOM_NOT_FOUND' || estado.error.code === 'VALIDATION_ERROR' ? (
          <Alert
            tone="danger"
            title="No encontramos esta sala"
            actions={(
              <>
                <ButtonLink to={RUTAS.unirseSala}>Probar con otro ID</ButtonLink>
                <ButtonLink variant="secondary" to={RUTAS.panel}>Volver a Mis salas</ButtonLink>
              </>
            )}
          >
            Revisa el enlace o pídele el ID al anfitrión. Puede que la sala ya no exista.
          </Alert>
        ) : (
          <Alert
            tone="danger"
            title="No pudimos entrar a la sala"
            actions={<Button onClick={reintentar}><Icon name="refresh" />Reintentar</Button>}
          >
            {mensajeDeError(estado.error)}
          </Alert>
        ))}
        {estado.fase === 'eliminada' && (
          <Alert
            tone="warning"
            title="El anfitrión eliminó esta sala"
            actions={<ButtonLink to={RUTAS.panel}>Volver a Mis salas</ButtonLink>}
          >
            Ya no puedes enviar mensajes aquí.
          </Alert>
        )}
      </div>

      {estado.fase === 'lista' && <DatosSala sala={estado.sala} />}
    </div>
  );
}

function DatosSala({ sala }: { sala: SalaEnVivo }) {
  const [copia, setCopia] = useState<'ok' | 'error'>();

  async function copiarId() {
    try {
      await navigator.clipboard.writeText(sala.id);
      setCopia('ok');
    } catch {
      setCopia('error');
    }
  }

  return (
    <Card>
      <dl className="space-y-4 text-muted">
        <div>
          <dt className="font-bold text-ink">ID de la sala</dt>
          <dd className="flex flex-wrap items-center gap-3">
            <code className="wrap-anywhere select-all">{sala.id}</code>
            <Button variant="secondary" size="sm" onClick={() => void copiarId()} aria-label={`Copiar ID de ${sala.nombre}`}>
              Copiar ID
            </Button>
          </dd>
        </div>
        <div>
          <dt className="font-bold text-ink">Tu rol</dt>
          <dd>{sala.rol === 'administrador' ? 'Administrador' : 'Invitado'}</dd>
        </div>
      </dl>
      <p role="status" aria-atomic="true" className="mt-4 text-sm font-bold">
        {copia === 'ok' && <span className="text-success-700">ID copiado. Compártelo con tu grupo.</span>}
        {copia === 'error' && <span className="text-danger-700">No pudimos copiar el ID. Selecciónalo y cópialo manualmente.</span>}
      </p>
    </Card>
  );
}
