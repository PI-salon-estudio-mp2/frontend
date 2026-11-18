import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../features/auth/AuthContext';
import { crearSala, MAX_NOMBRE_SALA, MIN_NOMBRE_SALA } from '../features/salas/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { toApiError } from '../lib/api';
import { RUTAS, rutaSala } from '../routes/rutas';

const ID_NOMBRE = 'nombre-sala';

export function CrearSala() {
  usePageTitle('Crear sala');
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return null;
  return <FormularioSala key={estado.user.uid} />;
}

function FormularioSala() {
  const navigate = useNavigate();
  const { obtenerToken } = useAuth();
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enfoque, setEnfoque] = useState(0);
  const [creando, setCreando] = useState(false);
  const peticion = useRef<AbortController | null>(null);
  const solicitud = useRef<{ nombre: string; id: string } | null>(null);

  useEffect(() => () => peticion.current?.abort(), []);

  function mostrarErrorNombre(mensaje: string) {
    setErrorNombre(mensaje);
    setEnfoque((anterior) => anterior + 1);
  }

  async function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (peticion.current) return;
    setErrorGeneral(undefined);
    const limpio = nombre.trim();
    if (limpio.length < MIN_NOMBRE_SALA || limpio.length > MAX_NOMBRE_SALA) {
      mostrarErrorNombre(`Escribe un nombre de entre ${MIN_NOMBRE_SALA} y ${MAX_NOMBRE_SALA} caracteres.`);
      return;
    }

    setErrorNombre(undefined);
    const controller = new AbortController();
    const { signal } = controller;
    peticion.current = controller;
    setCreando(true);
    try {
      if (solicitud.current?.nombre !== limpio) {
        solicitud.current = { nombre: limpio, id: crypto.randomUUID() };
      }
      const token = await obtenerToken();
      if (signal.aborted) return;
      const sala = await crearSala(limpio, solicitud.current.id, token, signal);
      if (!signal.aborted) {
        navigate(rutaSala(sala.id), { replace: true, state: { salaCreada: sala.id } });
      }
    } catch (e) {
      if (signal.aborted) return;
      const error = toApiError(e);
      if (error.fields?.nombre) mostrarErrorNombre(error.fields.nombre);
      else setErrorGeneral(error.message);
      if (error.code === 'ROOM_REQUEST_CONFLICT') solicitud.current = null;
    } finally {
      peticion.current = null;
      if (!signal.aborted) setCreando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title="Crear sala" />
      <Card>
        <AvisoFormulario titulo="No pudimos crear la sala" mensaje={errorGeneral} />
        <FormErrorSummary
          enfoque={enfoque}
          errores={errorNombre ? [{ id: ID_NOMBRE, mensaje: errorNombre }] : []}
        />
        <div role="status" aria-atomic="true" className="sr-only">
          {creando ? 'Creando sala…' : ''}
        </div>
        <form noValidate onSubmit={confirmar} aria-busy={creando} className="space-y-6">
          <TextField
            id={ID_NOMBRE}
            label="Nombre de la sala"
            hint={`Usa entre ${MIN_NOMBRE_SALA} y ${MAX_NOMBRE_SALA} caracteres.`}
            obligatorio
            readOnly={creando}
            value={nombre}
            error={errorNombre}
            onChange={(event) => {
              setNombre(event.target.value);
              setErrorNombre(undefined);
              setErrorGeneral(undefined);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" aria-disabled={creando}>
              {creando && <Spinner className="size-5 text-current" />}
              {creando ? 'Creando sala…' : 'Crear sala'}
            </Button>
            <ButtonLink variant="secondary" to={RUTAS.panel}>Cancelar</ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}
