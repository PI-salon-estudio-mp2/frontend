import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { useAuth } from '../features/auth/AuthContext';
import { nombrePropio } from '../features/auth/nombres';
import { AvisoExitoSala } from '../features/salas/AvisoExitoSala';
import { listarSalas } from '../features/salas/api';
import { TarjetaSala } from '../features/salas/TarjetaSala';
import { useConsultaSalas } from '../features/salas/useConsultaSalas';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

export function Panel() {
  usePageTitle('Mis salas');
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;

  const { user, perfil } = estado;
  return <PanelSalas key={user.uid} saludo={nombrePropio(perfil.nombres) || perfil.username} />;
}

function PanelSalas({ saludo }: { saludo: string }) {
  const { estado, reintentar } = useConsultaSalas(listarSalas);
  const location = useLocation();
  const navigate = useNavigate();
  const [copia, setCopia] = useState<{ id: string | null; version: number }>({ id: null, version: 0 });

  function notificarCopia(id: string | null) {
    setCopia((anterior) => ({ id, version: anterior.version + 1 }));
  }

  // La bienvenida solo aparece al llegar desde el registro y no se repite al recargar.
  const [mostrarBienvenida] = useState(
    () => typeof location.state === 'object' && location.state !== null && 'bienvenida' in location.state,
  );
  // El aviso de «Nombre actualizado» llega desde la pantalla de edición y tampoco se repite al recargar.
  const [salaRenombrada] = useState(() => {
    const estadoNavegacion: unknown = location.state;
    return typeof estadoNavegacion === 'object' && estadoNavegacion !== null
      && 'salaRenombrada' in estadoNavegacion && typeof estadoNavegacion.salaRenombrada === 'string'
      ? estadoNavegacion.salaRenombrada
      : undefined;
  });
  const limpiado = useRef(false);
  useEffect(() => {
    if ((mostrarBienvenida || salaRenombrada) && !limpiado.current) {
      limpiado.current = true;
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [mostrarBienvenida, salaRenombrada, navigate, location.pathname]);

  const vacio = estado.status === 'exito' && estado.datos.length === 0;
  // Un solo botón principal por pantalla: con salas, «Entrar» (en cada tarjeta) es el principal
  // y «Crear sala» del encabezado es secundario; sin salas, «Crear mi primera sala» es el único.
  const accionCrear = (variant: 'primary' | 'secondary', texto: string) => (
    <ButtonLink to={RUTAS.crearSala} variant={variant}>
      <Icon name="plus" />
      {texto}
    </ButtonLink>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {saludo && <p className="mb-1 text-lg text-muted">Hola, {saludo}</p>}
      <PageHeader title="Mis salas" actions={vacio ? undefined : accionCrear('secondary', 'Crear sala')} />

      <div role="status" className={mostrarBienvenida ? 'mb-6' : undefined}>
        {mostrarBienvenida && (
          <Alert tone="success" title="¡Bienvenido a Salón de Estudio!">
            Tu cuenta está lista.
          </Alert>
        )}
      </div>
      <AvisoExitoSala
        aviso={copia.id ? {
          titulo: 'ID copiado',
          mensaje: `Copiaste el código ${copia.id}. Compártelo con tu grupo para invitarlos.`,
        } : salaRenombrada ? {
          titulo: 'Nombre actualizado',
          mensaje: `La sala ahora se llama «${salaRenombrada}».`,
        } : undefined}
        version={copia.version}
      />

      {estado.status === 'cargando' && <PantallaCarga texto="Cargando salas…" />}
      <div role="alert">
        {estado.status === 'error' && (
          <Alert
            tone="danger"
            title="No pudimos cargar tus salas"
            actions={<Button onClick={reintentar}><Icon name="refresh" />Reintentar</Button>}
          >
            {estado.error.message}
          </Alert>
        )}
      </div>
      {estado.status === 'exito' && (vacio ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary-50 text-primary-700">
            <Icon name="home" className="size-8" />
          </span>
          <h2 className="text-xl font-bold">Aún no tienes salas</h2>
          <p className="max-w-md text-muted">Crea tu primera sala para organizar tu grupo de estudio.</p>
          {accionCrear('primary', 'Crear mi primera sala')}
        </Card>
      ) : (
        <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {estado.datos.map((sala) => (
            <li key={sala.id}><TarjetaSala sala={sala} notificarCopia={notificarCopia} /></li>
          ))}
        </ul>
      ))}
    </div>
  );
}
