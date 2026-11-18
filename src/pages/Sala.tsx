import { useCallback } from 'react';
import { useLocation, useParams } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { useAuth } from '../features/auth/AuthContext';
import { AvisoExitoSala } from '../features/salas/AvisoExitoSala';
import { obtenerSala } from '../features/salas/api';
import { useConsultaSalas } from '../features/salas/useConsultaSalas';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

export function Sala() {
  const { id = '' } = useParams();
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;
  return <InteriorSala key={`${estado.user.uid}:${id}`} id={id} />;
}

function InteriorSala({ id }: { id: string }) {
  const consultar = useCallback((token: string, signal: AbortSignal) => obtenerSala(id, token, signal), [id]);
  const { estado, reintentar } = useConsultaSalas(consultar);
  const { state } = useLocation();
  const titulo = estado.status === 'exito' ? estado.datos.nombre : 'Sala de estudio';
  usePageTitle(titulo);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title={titulo}
        actions={(
          <ButtonLink variant="secondary" to={RUTAS.panel}>
            <Icon name="arrowLeft" />
            Volver a Mis salas
          </ButtonLink>
        )}
      />

      {estado.status === 'cargando' && <PantallaCarga texto="Cargando sala…" />}
      <AvisoExitoSala
        aviso={estado.status === 'exito' && state?.salaCreada === id ? {
          titulo: 'Sala creada',
          mensaje: 'Comparte el ID para que tu grupo pueda entrar.',
        } : undefined}
      />
      <div role="alert">
        {estado.status === 'error' && (estado.error.code === 'ROOM_NOT_FOUND' ? (
          <Alert tone="danger" title="La sala no existe o no está en tu panel.">
            Vuelve a «Mis salas» y abre una sala desde tu panel.
          </Alert>
        ) : (
          <Alert
            tone="danger"
            title="No pudimos cargar la sala"
            actions={<Button onClick={reintentar}><Icon name="refresh" />Reintentar</Button>}
          >
            {estado.error.message}
          </Alert>
        ))}
      </div>
      {estado.status === 'exito' && (
        <Card>
          <dl className="space-y-4 text-muted">
            <div>
              <dt className="font-bold text-ink">ID de la sala</dt>
              <dd><code className="wrap-anywhere select-all">{estado.datos.id}</code></dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Tu rol</dt>
              <dd>Administrador</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
