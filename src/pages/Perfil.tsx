import { useRef, useState, type FormEvent } from 'react';
import { EliminarCuenta } from '../features/auth/EliminarCuenta';
import { Alert } from '../components/ui/Alert';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../features/auth/AuthContext';
import { Avatar } from '../features/auth/Avatar';
import { MENSAJE_CORREO_EN_USO, MENSAJE_USERNAME_EN_USO } from '../features/auth/mensajesAuth';
import { AvatarPicker } from '../features/auth/AvatarPicker';
import type { DatosPerfil, Perfil as PerfilGuardado } from '../features/auth/contrato';
import {
  AYUDA_USERNAME, normalizarUsername, notaUsername,
  validarCorreo, validarNombre, validarUsername,
} from '../features/auth/validaciones';
import { usePageTitle } from '../hooks/usePageTitle';
import { toApiError } from '../lib/api';

type Campo = keyof DatosPerfil;
type Errores = Partial<Record<Campo, string>>;
const CAMPOS: Campo[] = ['nombres', 'apellidos', 'username', 'correo', 'avatar'];

function datosDelPerfil(perfil: PerfilGuardado): DatosPerfil {
  const { nombres, apellidos, username, correo, avatar } = perfil;
  return { nombres, apellidos, username, correo, avatar };
}

export function Perfil() {
  usePageTitle('Mi perfil');
  const { estado } = useAuth();
  if (estado.status !== 'autenticado') return <PantallaCarga texto="Cargando perfil…" />;
  return <FormularioPerfil key={estado.user.uid} perfil={estado.perfil} />;
}

function FormularioPerfil({ perfil }: { perfil: PerfilGuardado }) {
  const { actualizarPerfil } = useAuth();
  const [datos, setDatos] = useState(() => datosDelPerfil(perfil));
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [enfoque, setEnfoque] = useState(0);
  const enviando = useRef(false);
  const guardado = useRef(perfil);
  const hayCambios = CAMPOS.some((campo) => datos[campo] !== guardado.current[campo]);
  const iniciales = `${datos.nombres.trim().charAt(0)}${datos.apellidos.trim().charAt(0)}`.toLocaleUpperCase('es') || 'E';

  const cambiar = (campo: Campo, valor: string) => {
    if (enviando.current) return;
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setErrorGeneral(undefined);
    setExito(false);
  };

  const cancelar = () => {
    if (enviando.current) return;
    setDatos(datosDelPerfil(guardado.current));
    setErrores({});
    setErrorGeneral(undefined);
    setExito(false);
  };

  const mostrarErrores = (nuevos: Errores) => {
    setErrores(nuevos);
    setEnfoque((actual) => actual + 1);
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando.current || !hayCambios) return;
    setErrorGeneral(undefined);
    setExito(false);
    const nuevos: Errores = {
      nombres: validarNombre(datos.nombres, 'nombres'),
      apellidos: validarNombre(datos.apellidos, 'apellidos'),
      username: validarUsername(datos.username),
      correo: validarCorreo(datos.correo),
    };
    if (CAMPOS.some((campo) => nuevos[campo])) {
      mostrarErrores(nuevos);
      return;
    }
    setErrores({});
    enviando.current = true;
    setGuardando(true);
    try {
      const actualizado = await actualizarPerfil({
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        username: normalizarUsername(datos.username),
        correo: datos.correo.trim().toLowerCase(),
        avatar: datos.avatar,
      });
      guardado.current = actualizado;
      setDatos(datosDelPerfil(actualizado));
      setExito(true);
    } catch (e) {
      const error = toApiError(e);
      const porCampo: Errores = {};
      for (const campo of CAMPOS) {
        if (error.fields?.[campo]) porCampo[campo] = error.fields[campo];
      }
      if (error.code === 'USERNAME_TAKEN') porCampo.username = MENSAJE_USERNAME_EN_USO;
      if (error.code === 'EMAIL_TAKEN') porCampo.correo = MENSAJE_CORREO_EN_USO;
      if (CAMPOS.some((campo) => porCampo[campo])) mostrarErrores(porCampo);
      else setErrorGeneral(error.message);
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title="Mi perfil" description="Consulta y actualiza tus datos personales." />
      <Card>
        <div role="status" aria-atomic="true" className={exito ? 'mb-6' : undefined}>
          {exito && <Alert tone="success" title="Perfil actualizado" />}
          {guardando && <span className="sr-only">Guardando…</span>}
        </div>
        <FormErrorSummary
          enfoque={enfoque}
          errores={CAMPOS.flatMap((campo) => errores[campo] ? [{ id: campo, mensaje: errores[campo]! }] : [])}
        />
        <form noValidate onSubmit={guardar} aria-busy={guardando}>
          <fieldset disabled={guardando} className="space-y-5 disabled:opacity-70">
            <legend className="sr-only">Datos personales</legend>
            <div className="flex items-center gap-4 border-b border-primary-100 pb-5">
              <Avatar key={datos.avatar} id={datos.avatar} iniciales={iniciales} className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="break-words font-bold text-ink">{`${datos.nombres} ${datos.apellidos}`.trim() || 'Estudiante'}</p>
                <p className="break-words text-muted">@{datos.username}</p>
                {!datos.avatar && <p className="text-sm text-muted">Avatar por defecto</p>}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="nombres" name="nombres" label="Nombres" autoComplete="given-name" obligatorio
                value={datos.nombres} error={errores.nombres} onChange={(e) => cambiar('nombres', e.target.value)} />
              <TextField id="apellidos" name="apellidos" label="Apellidos" autoComplete="family-name" obligatorio
                value={datos.apellidos} error={errores.apellidos} onChange={(e) => cambiar('apellidos', e.target.value)} />
            </div>
            <TextField id="username" name="username" label="Nombre de usuario" autoComplete="username"
              autoCapitalize="none" spellCheck={false} obligatorio hint={AYUDA_USERNAME} nota={notaUsername(datos.username)}
              value={datos.username} error={errores.username} onChange={(e) => cambiar('username', e.target.value)} />
            <TextField id="correo" name="email" label="Correo electrónico" type="email" autoComplete="email"
              inputMode="email" autoCapitalize="none" spellCheck={false} obligatorio
              value={datos.correo} error={errores.correo} onChange={(e) => cambiar('correo', e.target.value)} />
            <AvatarPicker id="avatar" value={datos.avatar} error={errores.avatar} obligatorio={false}
              onChange={(avatar) => cambiar('avatar', avatar)} />
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => cambiar('avatar', '')} disabled={!datos.avatar}>
                Usar avatar por defecto
              </Button>
              {/^https:\/\//i.test(guardado.current.avatar) && datos.avatar !== guardado.current.avatar && (
                <Button variant="ghost" onClick={() => cambiar('avatar', guardado.current.avatar)}>Conservar mi foto actual</Button>
              )}
            </div>
          </fieldset>
          <div className="mt-6">
            <AvisoFormulario mensaje={errorGeneral} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={guardando || !hayCambios}
                aria-describedby={!guardando && !hayCambios ? 'guardar-ayuda' : undefined}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button variant="secondary" onClick={cancelar} disabled={guardando}>Cancelar</Button>
            </div>
          </div>
            {!guardando && !hayCambios && (
              <p id="guardar-ayuda" className="mt-3 text-sm text-muted">Cambia algún dato para poder guardar.</p>
            )}
        </form>
      </Card>
      <EliminarCuenta disabled={guardando} />
    </div>
  );
}
