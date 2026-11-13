import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary, type ErrorCampo } from '../components/ui/FormErrorSummary';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../features/auth/AuthContext';
import { AvatarPicker } from '../features/auth/AvatarPicker';
import { BotonGoogle, SeparadorO } from '../features/auth/BotonGoogle';
import { mensajeErrorAuth } from '../features/auth/mensajesAuth';
import {
  AYUDA_USERNAME,
  POLITICA_CONTRASENA,
  normalizarUsername,
  validarContrasena,
  validarCorreo,
  validarNombre,
  validarUsername,
  notaUsername,
} from '../features/auth/validaciones';
import { usePageTitle } from '../hooks/usePageTitle';
import { apiRequest, toApiError, type ApiError } from '../lib/api';
import { RUTAS } from '../routes/rutas';

type Campo = 'nombres' | 'apellidos' | 'username' | 'avatar' | 'correo' | 'contrasena';
type Datos = Record<Campo, string>;
type Errores = Partial<Record<Campo, string>>;

/** Orden de los campos en la pantalla: también el del resumen de errores. */
const ORDEN: Campo[] = ['nombres', 'apellidos', 'username', 'avatar', 'correo', 'contrasena'];
const VACIO: Datos = { nombres: '', apellidos: '', username: '', avatar: '', correo: '', contrasena: '' };

function validar(d: Datos): Errores {
  return {
    nombres: validarNombre(d.nombres, 'nombres'),
    apellidos: validarNombre(d.apellidos, 'apellidos'),
    username: validarUsername(d.username),
    avatar: d.avatar ? undefined : 'Elige un avatar.',
    correo: validarCorreo(d.correo),
    contrasena: validarContrasena(d.contrasena),
  };
}

/** Convierte un error del servidor en mensajes por campo. */
function erroresDelServidor(error: ApiError): Errores {
  const nuevos: Errores = {};
  for (const campo of ORDEN) {
    const mensaje = error.fields?.[campo];
    if (mensaje) nuevos[campo] = mensaje;
  }
  if (error.code === 'USERNAME_TAKEN' && !nuevos.username) nuevos.username = error.message;
  if (error.code === 'EMAIL_TAKEN' && !nuevos.correo) nuevos.correo = error.message;
  return nuevos;
}

export function Registro() {
  usePageTitle('Crear cuenta');
  const { estado, iniciarSesion, continuarConGoogle, recargarPerfil, cerrarSesion } = useAuth();

  const [datos, setDatos] = useState<Datos>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [correoRegistrado, setCorreoRegistrado] = useState(false);
  const [enviando, setEnviando] = useState<'registro' | 'google' | null>(null);
  const [enfoque, setEnfoque] = useState(0);

   if (estado.status === 'autenticado') {
    return <Navigate to={RUTAS.panel} replace state={enviando ? { bienvenida: true } : undefined} />;
  }
  if (estado.status === 'sin-username') return <Navigate to={RUTAS.elegirUsername} replace />;
  if (estado.status === 'cargando' && !enviando) return <PantallaCarga texto="Verificando tu sesión…" />;

  const ocupado = enviando !== null && estado.status !== 'error';

  const listaErrores: ErrorCampo[] = [];
  for (const campo of ORDEN) {
    const mensaje = errores[campo];
    if (mensaje) listaErrores.push({ id: campo, mensaje });
  }

  const cambiar = (campo: Campo, valor: string) => {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
    if (campo === 'correo') setCorreoRegistrado(false);
  };

  const mostrarErrores = (nuevos: Errores) => {
    setErrores(nuevos);
    setEnfoque((n) => n + 1);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ocupado) return;
    setErrorGeneral(undefined);
    setCorreoRegistrado(false);

    const nuevos = validar(datos);
    if (ORDEN.some((campo) => nuevos[campo])) {
      mostrarErrores(nuevos);
      return;
    }
    setErrores({});
    setEnviando('registro');

    try {
      await apiRequest('/api/auth/registro', {
        method: 'POST',
        body: {
          nombres: datos.nombres.trim(),
          apellidos: datos.apellidos.trim(),
          username: normalizarUsername(datos.username),
          avatar: datos.avatar,
          correo: datos.correo.trim(),
          contrasena: datos.contrasena,
        },
        parse: () => undefined,
      });
    } catch (e) {
      const error = toApiError(e);
      const delServidor = erroresDelServidor(error);
      if (ORDEN.some((campo) => delServidor[campo])) {
        mostrarErrores(delServidor);
        setCorreoRegistrado(error.code === 'EMAIL_TAKEN');
      } else {
        setErrorGeneral(error.message);
      }
      setEnviando(null);
      return;
    }

    // La cuenta ya existe: iniciamos sesión y AuthProvider lleva al panel.
    try {
      await iniciarSesion(datos.correo.trim(), datos.contrasena);
    } catch {
      setErrorGeneral(
        'Tu cuenta se creó, pero no pudimos iniciar tu sesión automáticamente. Ve a «Iniciar sesión» con tu correo y contraseña.',
      );
      setEnviando(null);
    }
  };

  const onGoogle = async () => {
    if (ocupado) return;
    setErrorGeneral(undefined);
    setEnviando('google');
    try {
      await continuarConGoogle();
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error));
      setEnviando(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Crear cuenta"
        description="Regístrate con tus datos o con Google para empezar a estudiar en grupo."
      />

      <Card>
        {estado.status === 'error' && (
          <div className="mb-6">
            <Alert
              tone="danger"
              title="No pudimos cargar tu cuenta"
              actions={
                <>
                  <Button variant="secondary" onClick={() => void recargarPerfil()}>
                    <Icon name="refresh" />
                    Reintentar
                  </Button>
                  <Button variant="ghost" onClick={() => void cerrarSesion()}>
                    Cerrar sesión
                  </Button>
                </>
              }
            >
              <p>{estado.error.message}</p>
            </Alert>
          </div>
        )}

        <AvisoFormulario mensaje={errorGeneral} />
        <BotonGoogle onClick={() => void onGoogle()} cargando={ocupado && enviando === 'google'} />
        <SeparadorO texto="o regístrate con tu correo" />
        <FormErrorSummary errores={listaErrores} enfoque={enfoque} />

        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="nombres"
              name="nombres"
              label="Nombres"
              autoComplete="given-name"
              obligatorio
              value={datos.nombres}
              error={errores.nombres}
              onChange={(e) => cambiar('nombres', e.target.value)}
            />
            <TextField
              id="apellidos"
              name="apellidos"
              label="Apellidos"
              autoComplete="family-name"
              obligatorio
              value={datos.apellidos}
              error={errores.apellidos}
              onChange={(e) => cambiar('apellidos', e.target.value)}
            />
          </div>

          <TextField
            id="username"
            name="username"
            label="Nombre de usuario"
            hint={AYUDA_USERNAME}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            obligatorio
            value={datos.username}
            nota={notaUsername(datos.username)}
            error={errores.username}
            onChange={(e) => cambiar('username', e.target.value)}
          />

          <AvatarPicker
            id="avatar"
            value={datos.avatar}
            error={errores.avatar}
            onChange={(id) => cambiar('avatar', id)}
          />

          <TextField
            id="correo"
            name="email"
            type="email"
            label="Correo electrónico"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            obligatorio
            value={datos.correo}
            error={errores.correo}
            accionError={
              correoRegistrado ? (
                <Link to={RUTAS.ingresar} className="font-bold text-primary-700 underline underline-offset-4">
                  Ir a iniciar sesión
                </Link>
              ) : undefined
            }
            onChange={(e) => cambiar('correo', e.target.value)}
          />

          <PasswordField
            id="contrasena"
            name="new-password"
            label="Contraseña"
            hint={POLITICA_CONTRASENA}
            autoComplete="new-password"
            obligatorio
            value={datos.contrasena}
            error={errores.contrasena}
            onChange={(e) => cambiar('contrasena', e.target.value)}
          />

          <Button type="submit" className="w-full" aria-disabled={ocupado || undefined}>
            {ocupado && enviando === 'registro' ? 'Creando tu cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="sr-only" role="status">
          {ocupado ? 'Creando tu cuenta, espera un momento.' : ''}
        </p>

        <p className="mt-6 text-center text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to={RUTAS.ingresar} className="font-bold text-primary-700 underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}