import { Navigate, Outlet, useLocation } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { PantallaCarga } from '../../components/ui/PantallaCarga';
import { RUTAS } from '../../routes/rutas';
import { useAuth } from './AuthContext';

/** Protege las rutas privadas: sin sesión va al login y, después de entrar, vuelve a la ruta pedida. */
export function RequireAuth() {
  const { estado, avisoCierre, recargarPerfil, cerrarSesion } = useAuth();
  const location = useLocation();

  switch (estado.status) {
    case 'cargando':
      return <PantallaCarga texto="Verificando tu sesión…" />;
    case 'anonimo':
      return (
        <Navigate
          to={RUTAS.ingresar}
          replace
          state={avisoCierre ? undefined : { from: `${location.pathname}${location.search}` }}
        />
      );
    case 'sin-username':
      return <Navigate to={RUTAS.elegirUsername} replace />;
    case 'error':
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Alert
            tone="danger"
            title="No pudimos cargar tu cuenta"
            actions={
              <>
                <Button onClick={() => void recargarPerfil()}>
                  <Icon name="refresh" />
                  Reintentar
                </Button>
                <Button variant="secondary" onClick={() => void cerrarSesion()}>
                  Cerrar sesión
                </Button>
              </>
            }
          >
            <p>{estado.error.message}</p>
          </Alert>
        </div>
      );
    case 'autenticado':
      return <Outlet />;
  }
}