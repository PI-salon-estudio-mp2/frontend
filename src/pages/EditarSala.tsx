import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { Spinner } from '../components/ui/Spinner';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../features/auth/AuthContext';
import {
  actualizarSala, MAX_NOMBRE_SALA, MIN_NOMBRE_SALA, obtenerSala, type SalaAdministrada,
} from '../features/salas/api';
import { useConsultaSalas } from '../features/salas/useConsultaSalas';
import { usePageTitle } from '../hooks/usePageTitle';
import { toApiError } from '../lib/api';
import { RUTAS } from '../routes/rutas';

const ID_NOMBRE = 'nombre-sala';

export function EditarSala() {
  usePageTitle('Editar nombre de la sala');
  const { id = '' } = useParams();
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;
  return <CargarSala key={`${estado.user.uid}:${id}`} id={id} />;
}

function CargarSala({ id }: { id: string }) {
  const consultar = useCallback((token: string, signal: AbortSignal) => obtenerSala(id, token, signal), [id]);
  const { estado, reintentar } = useConsultaSalas(consultar);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title="Editar nombre de la sala" description="Solo el anfitrión puede cambiar el nombre." />
      {estado.status === 'cargando' && <PantallaCarga texto="Cargando sala…" />}
      <div role="alert">
        {estado.status === 'error' && (estado.error.code === 'ROOM_NOT_FOUND' ? (
          <Alert
            tone="danger"
            title="La sala no existe o no está en tu panel."
            actions={<ButtonLink variant="secondary" to={RUTAS.panel}><Icon name="arrowLeft" />Volver a Mis salas</ButtonLink>}
          />
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
      {estado.status === 'exito' && <FormularioNombre sala={estado.datos} />}
    </div>
  );
}

function FormularioNombre({ sala }: { sala: SalaAdministrada }) {
  const navigate = useNavigate();
  const { obtenerToken } = useAuth();
  const [nombre, setNombre] = useState(sala.nombre);
  const [errorNombre, setErrorNombre] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enfoque, setEnfoque] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const peticion = useRef<AbortController | null>(null);

  useEffect(() => () => peticion.current?.abort(), []);

  function mostrarErrorNombre(mensaje: string) {
    setErrorNombre(mensaje);
    setEnfoque((anterior) => anterior + 1);
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (peticion.current) return;
    setErrorGeneral(undefined);
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (limpio.length < MIN_NOMBRE_SALA || limpio.length > MAX_NOMBRE_SALA) {
      mostrarErrorNombre(`Escribe un nombre de entre ${MIN_NOMBRE_SALA} y ${MAX_NOMBRE_SALA} caracteres.`);
      return;
    }
    if (limpio === sala.nombre) {
      mostrarErrorNombre('Escribe un nombre distinto al actual o cancela.');
      return;
    }

    setErrorNombre(undefined);
    const controller = new AbortController();
    const { signal } = controller;
    peticion.current = controller;
    setGuardando(true);
    try {
      const token = await obtenerToken();
      if (signal.aborted) return;
      const actualizada = await actualizarSala(sala.id, limpio, token, signal);
      if (!signal.aborted) {
        navigate(RUTAS.panel, { replace: true, state: { salaRenombrada: actualizada.nombre } });
      }
    } catch (e) {
      if (signal.aborted) return;
      const error = toApiError(e);
      if (error.fields?.nombre) mostrarErrorNombre(error.fields.nombre);
      else setErrorGeneral(error.message);
    } finally {
      peticion.current = null;
      if (!signal.aborted) setGuardando(false);
    }
  }

  return (
    <Card>
      <AvisoFormulario titulo="No pudimos cambiar el nombre" mensaje={errorGeneral} />
      <FormErrorSummary
        enfoque={enfoque}
        errores={errorNombre ? [{ id: ID_NOMBRE, mensaje: errorNombre }] : []}
      />
      <div role="status" aria-atomic="true" className="sr-only">
        {guardando ? 'Guardando nombre…' : ''}
      </div>
      <p className="mb-6 text-sm text-muted">
        <span className="font-bold">ID de la sala:</span>{' '}
        <code className="wrap-anywhere select-all">{sala.id}</code>
      </p>
      <form noValidate onSubmit={guardar} aria-busy={guardando} className="space-y-6">
        <TextField
          id={ID_NOMBRE}
          label="Nombre de la sala"
          hint={`Usa entre ${MIN_NOMBRE_SALA} y ${MAX_NOMBRE_SALA} caracteres.`}
          obligatorio
          readOnly={guardando}
          value={nombre}
          error={errorNombre}
          onChange={(event) => {
            setNombre(event.target.value);
            setErrorNombre(undefined);
            setErrorGeneral(undefined);
          }}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" aria-disabled={guardando}>
            {guardando && <Spinner className="size-5 text-current" />}
            {guardando ? 'Guardando…' : 'Guardar nombre'}
          </Button>
          <ButtonLink variant="secondary" to={RUTAS.panel}>Cancelar</ButtonLink>
        </div>
      </form>
    </Card>
  );
}
