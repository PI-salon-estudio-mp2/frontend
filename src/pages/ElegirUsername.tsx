import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { AvisoFormulario } from '../components/ui/AvisoFormulario';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormErrorSummary, type ErrorCampo } from '../components/ui/FormErrorSummary';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PantallaCarga } from '../components/ui/PantallaCarga';
import { TextField } from '../components/ui/TextField';
import { useAuth } from '../features/auth/AuthContext';
import { parsePerfil } from '../features/auth/contrato';
import { AYUDA_USERNAME, normalizarUsername, validarUsername, notaUsername } from '../features/auth/validaciones';
import { usePageTitle } from '../hooks/usePageTitle';
import { apiRequest, toApiError } from '../lib/api';
import { RUTAS } from '../routes/rutas';

export function ElegirUsername() {
  usePageTitle('Elige tu nombre de usuario');
  const { estado, obtenerToken, recargarPerfil, cerrarSesion } = useAuth();

  const [username, setUsername] = useState('');
  const [errorCampo, setErrorCampo] = useState<string>();
  const [errorGeneral, setErrorGeneral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [enfoque, setEnfoque] = useState(0);

  if (estado.status === 'cargando' && !enviando) return <PantallaCarga texto="Verificando tu sesión…" />;
  if (estado.status === 'anonimo') return <Navigate to={RUTAS.ingresar} replace />;
    if (estado.status === 'autenticado') {
    return <Navigate to={RUTAS.panel} replace state={enviando ? { bienvenida: true } : undefined} />;
  }

  if (estado.status === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
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
    );
  }

  const correoGoogle = estado.status === 'sin-username' ? estado.user.email : null;
  const listaErrores: ErrorCampo[] = errorCampo ? [{ id: 'username', mensaje: errorCampo }] : [];

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando) return;
    setErrorGeneral(undefined);

    const mensaje = validarUsername(username);
    setErrorCampo(mensaje);
    if (mensaje) {
      setEnfoque((n) => n + 1);
      return;
    }

    setEnviando(true);
    try {
      const token = await obtenerToken();
      await apiRequest('/api/users/me/username', {
        method: 'POST',
        body: { username: normalizarUsername(username) },
        token,
        parse: parsePerfil,
      });
      // Al recargar el perfil, AuthProvider pasa a «autenticado» y esta pantalla redirige al panel.
      await recargarPerfil();
    } catch (e) {
      const error = toApiError(e);
      if (error.status === 400 || error.status === 409) {
        setErrorCampo(error.fields?.username ?? error.message);
        setEnfoque((n) => n + 1);
      } else {
        setErrorGeneral(error.message);
      }
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        eyebrow="Último paso"
        title="Elige tu nombre de usuario"
        description="Así te verán los demás en las salas de estudio."
      />

      <Card>
        {correoGoogle && (
          <p className="mb-6 text-muted">
            Estás registrándote con la cuenta de Google <strong className="text-ink">{correoGoogle}</strong>.
          </p>
        )}

        <AvisoFormulario mensaje={errorGeneral} />
        <FormErrorSummary errores={listaErrores} enfoque={enfoque} />

        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <TextField
            id="username"
            name="username"
            label="Nombre de usuario"
            hint={AYUDA_USERNAME}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            obligatorio
            value={username}
            nota={notaUsername(username)}
            error={errorCampo}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrorCampo(undefined);
            }}
          />
          <Button type="submit" className="w-full" aria-disabled={enviando || undefined}>
            {enviando ? 'Guardando…' : 'Continuar'}
          </Button>
        </form>

        <p className="sr-only" role="status">
          {enviando ? 'Guardando tu nombre de usuario, espera un momento.' : ''}
        </p>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => void cerrarSesion()}>
            Cancelar y cerrar sesión
          </Button>
        </div>
      </Card>
    </div>
  );
}