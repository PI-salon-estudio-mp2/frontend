import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
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
import { BotonGoogle, SeparadorO } from '../features/auth/BotonGoogle';
import { leerDestino } from '../features/auth/destino';
import { mensajeErrorAuth } from '../features/auth/mensajesAuth';
import { validarCorreo } from '../features/auth/validaciones';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

interface Errores {
  correo?: string;
  contrasena?: string;
}

export function IniciarSesion() {
  usePageTitle('Iniciar sesión');
  const { estado, iniciarSesion, continuarConGoogle, recargarPerfil, cerrarSesion } = useAuth();
  const location = useLocation();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enviando, setEnviando] = useState<'correo' | 'google' | null>(null);
  const [enfoque, setEnfoque] = useState(0);

  // Con sesión iniciada no tiene sentido ver el formulario.
  if (estado.status === 'autenticado') return <Navigate to={leerDestino(location.state)} replace />;
  if (estado.status === 'sin-username') return <Navigate to={RUTAS.elegirUsername} replace />;
  if (estado.status === 'cargando' && !enviando) return <PantallaCarga texto="Verificando tu sesión…" />;

  // Si el perfil no pudo cargarse, el formulario deja de estar «enviando».
  const ocupado = enviando !== null && estado.status !== 'error';

  const listaErrores: ErrorCampo[] = [];
  if (errores.correo) listaErrores.push({ id: 'correo', mensaje: errores.correo });
  if (errores.contrasena) listaErrores.push({ id: 'contrasena', mensaje: errores.contrasena });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ocupado) return;
    setErrorGeneral(undefined);

    const nuevos: Errores = {
      correo: validarCorreo(correo),
      contrasena: contrasena ? undefined : 'Escribe tu contraseña.',
    };
    setErrores(nuevos);
    if (nuevos.correo || nuevos.contrasena) {
      setEnfoque((n) => n + 1);
      return;
    }

    setEnviando('correo');
    try {
      await iniciarSesion(correo.trim(), contrasena);
      // La navegación ocurre sola cuando AuthProvider confirma el perfil.
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error));
      setEnviando(null);
    }
  };

  const onGoogle = async () => {
    if (ocupado) return;
    setErrorGeneral(undefined);
    setErrores({});
    setEnviando('google');
    try {
      await continuarConGoogle();
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error));
      setEnviando(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Iniciar sesión"
        description="Entra con tu correo y contraseña o con tu cuenta de Google."
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
        <FormErrorSummary errores={listaErrores} enfoque={enfoque} />

        <form noValidate onSubmit={onSubmit} className="space-y-5">
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
            value={correo}
            error={errores.correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              setErrores((previos) => ({ ...previos, correo: undefined }));
            }}
          />
          <PasswordField
            id="contrasena"
            name="password"
            label="Contraseña"
            autoComplete="current-password"
            obligatorio
            value={contrasena}
            error={errores.contrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setErrores((previos) => ({ ...previos, contrasena: undefined }));
            }}
          />
          <Button type="submit" className="w-full" aria-disabled={ocupado || undefined}>
            {ocupado && enviando === 'correo' ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <SeparadorO />
        <BotonGoogle onClick={() => void onGoogle()} cargando={ocupado && enviando === 'google'} />

        <p className="sr-only" role="status">
          {ocupado ? 'Ingresando, espera un momento.' : ''}
        </p>

        <p className="mt-6 text-center text-muted">
          ¿Aún no tienes cuenta?{' '}
          <Link to={RUTAS.registro} className="font-bold text-primary-700 underline underline-offset-4">
            Crea una cuenta
          </Link>
        </p>
      </Card>
    </div>
  );
}