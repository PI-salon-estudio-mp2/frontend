import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { TextField } from '../components/ui/TextField';
import { errorIdSala, mensajeDeError, MENSAJES_TIEMPO_REAL, normalizarIdSala } from '../features/tiempo-real/contrato';
import { EstadoConexion } from '../features/tiempo-real/EstadoConexion';
import { useTiempoReal } from '../features/tiempo-real/TiempoRealContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS, rutaSala } from '../routes/rutas';

const ID_CAMPO = 'id-sala';

/** US-08 · Unirse a una sala con el ID que comparte el anfitrión. */
export function UnirseSala() {
  usePageTitle('Unirme a una sala');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { unirse, conexion, reconectar } = useTiempoReal();
  const [id, setId] = useState(() => params.get('id') ?? '');
  const [errorCampo, setErrorCampo] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enfoque, setEnfoque] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const activo = useRef(true);

  useEffect(() => {
    activo.current = true;
    return () => { activo.current = false; };
  }, []);

  function mostrarErrorCampo(mensaje: string) {
    setErrorCampo(mensaje);
    setEnfoque((n) => n + 1);
  }

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (buscando) return;
    setErrorGeneral(undefined);

    // Se recortan los espacios (también los que quedan al pegar) y se muestra el ID ya limpio.
    const limpio = normalizarIdSala(id);
    setId(limpio);
    const error = errorIdSala(limpio);
    if (error) {
      mostrarErrorCampo(error);
      return;
    }

    setErrorCampo(undefined);
    setBuscando(true);
    const respuesta = await unirse(limpio);
    if (!activo.current) return;
    setBuscando(false);

    if (respuesta.ok) {
      navigate(rutaSala(respuesta.data.sala.id), { state: { unida: true } });
      return;
    }
    if (respuesta.error.code === 'ROOM_NOT_FOUND') {
      mostrarErrorCampo(MENSAJES_TIEMPO_REAL.ROOM_NOT_FOUND);
    } else if (respuesta.error.code === 'VALIDATION_ERROR') {
      mostrarErrorCampo(mensajeDeError(respuesta.error));
    } else {
      setErrorGeneral(mensajeDeError(respuesta.error));
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Unirme a una sala"
        description="Escribe el ID que te compartió el anfitrión de la sala."
      />
      {buscando && <EstadoConexion conexion={conexion} onReintentar={reconectar} />}
      <Card>
        <AvisoFormulario titulo="No pudimos entrar a la sala" mensaje={errorGeneral} />
        <FormErrorSummary enfoque={enfoque} errores={errorCampo ? [{ id: ID_CAMPO, mensaje: errorCampo }] : []} />
        <div role="status" aria-atomic="true" className="sr-only">
          {buscando ? 'Buscando la sala…' : ''}
        </div>
        <form noValidate onSubmit={(e) => void entrar(e)} aria-busy={buscando} className="space-y-6">
          <TextField
            id={ID_CAMPO}
            label="ID de la sala"
            hint="Son 8 letras y números, por ejemplo K7P2QX9M. Lo encuentras en «Mis salas» de quien creó la sala."
            obligatorio
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            readOnly={buscando}
            value={id}
            error={errorCampo}
            onChange={(event) => {
              setId(event.target.value);
              setErrorCampo(undefined);
              setErrorGeneral(undefined);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" aria-disabled={buscando}>
              {buscando && <Spinner className="size-5 text-current" />}
              {buscando ? 'Buscando la sala…' : 'Entrar a la sala'}
            </Button>
            <ButtonLink variant="secondary" to={RUTAS.panel}>Cancelar</ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}
