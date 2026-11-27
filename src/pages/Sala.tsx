import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { useAuth } from '../features/auth/AuthContext';
import { Chat } from '../features/sala/Chat';
import { Participantes } from '../features/sala/Participantes';
import { useAnunciosSala } from '../features/sala/useAnunciosSala';
import { AvisoExitoSala } from '../features/salas/AvisoExitoSala';
import { EliminarSala } from '../features/salas/EliminarSala';
import { mensajeDeError, normalizarIdSala, type SalaEnVivo } from '../features/tiempo-real/contrato';
import { EstadoConexion } from '../features/tiempo-real/EstadoConexion';
import { useSalaEnVivo } from '../features/tiempo-real/useSalaEnVivo';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS, rutaEditarSala } from '../routes/rutas';

export function Sala() {
  const { id = '' } = useParams();
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;
  const roomId = normalizarIdSala(id);
  return <InteriorSala key={`${estado.user.uid}:${roomId}`} id={roomId} miUid={estado.user.uid} />;
}

/**
 * Interior de la sala: se entra validando el ID en el servidor de tiempo real (US-08) y
 * tiene tres zonas: chat (US-10/US-11), participantes conectados y datos de la sala.
 */
function InteriorSala({ id, miUid }: { id: string; miUid: string }) {
  const { estado, mensajes, presentes, conexion, enviar, reintentar, reconectar, anteriores, cargarAnteriores } = useSalaEnVivo(id);
  const anuncios = useAnunciosSala(mensajes, presentes, miUid, estado.fase === 'lista');
  const { state } = useLocation();
  const navigate = useNavigate();
  const titulo = estado.fase === 'lista' ? estado.sala.nombre : 'Sala de estudio';
  usePageTitle(titulo);

  // US-07 · Si el anfitrión elimina la sala con nosotros dentro, volvemos al panel con un aviso.
  const ultimoNombre = useRef(titulo);
  if (estado.fase === 'lista') ultimoNombre.current = estado.sala.nombre;
  useEffect(() => {
    if (estado.fase === 'eliminada') {
      navigate(RUTAS.panel, { replace: true, state: { salaCerradaPorAnfitrion: ultimoNombre.current } });
    }
  }, [estado.fase, navigate]);

  const esAnfitrion = estado.fase === 'lista' && estado.sala.rol === 'administrador';
  const acciones = (
    <>
      {/* Editar y eliminar solo los ve el anfitrión; a los invitados la API además les responde 403. */}
      {esAnfitrion && (
        <>
          <ButtonLink variant="secondary" to={rutaEditarSala(id)} aria-label={`Editar nombre de ${titulo}`}>
            Editar nombre
          </ButtonLink>
          <EliminarSala
            size="md"
            sala={{ id, nombre: titulo }}
            onEliminada={(nombre) => navigate(RUTAS.panel, { replace: true, state: { salaEliminada: nombre } })}
          />
        </>
      )}
      {/* En celular «Salir de la sala» va en la barra fija de arriba (#35). */}
      <span className="hidden lg:contents">
        <ButtonLink variant="secondary" to={RUTAS.panel}>
          <Icon name="arrowLeft" />
          Salir de la sala
        </ButtonLink>
      </span>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:py-14">
      {/* Celular: «Salir de la sala» siempre a la vista, fijo debajo del encabezado al hacer scroll (#35). */}
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <ButtonLink variant="secondary" size="sm" to={RUTAS.panel}>
          <Icon name="arrowLeft" />
          Salir de la sala
        </ButtonLink>
      </div>
      <PageHeader title={titulo} actions={acciones} />

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

      {estado.fase === 'lista' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Chat
            mensajes={mensajes}
            miUid={miUid}
            conectado={conexion.estado === 'conectado'}
            enviar={enviar}
            anteriores={anteriores}
            onCargarAnteriores={() => void cargarAnteriores()}
          />
          <aside aria-label="Información de la sala" className="space-y-6">
            <Participantes presentes={presentes} miUid={miUid} anfitrionUid={estado.sala.anfitrionUid} />
            <DatosSala sala={estado.sala} />
          </aside>
        </div>
      )}

      {/* Mensajes nuevos y entradas o salidas, anunciados sin mover el foco. */}
      <div role="log" aria-live="polite" aria-relevant="additions" className="sr-only">
        {anuncios.map((a) => <p key={a.id}>{a.texto}</p>)}
      </div>
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
    <Card className="p-5!">
      <h2 className="mb-3 text-lg font-bold text-ink">Datos de la sala</h2>
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
