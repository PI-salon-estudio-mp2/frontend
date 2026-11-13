import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../features/auth/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export function Panel() {
  usePageTitle('Mis salas');
  const { estado } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const saludo =
    estado.status === 'autenticado'
      ? `Hola, ${estado.perfil.nombres || estado.perfil.username}`
      : undefined;

  // La bienvenida solo aparece al llegar desde el registro y no se repite al recargar.
  const [mostrarBienvenida] = useState(
    () => typeof location.state === 'object' && location.state !== null && 'bienvenida' in location.state,
  );
  const limpiado = useRef(false);
  useEffect(() => {
    if (mostrarBienvenida && !limpiado.current) {
      limpiado.current = true;
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [mostrarBienvenida, navigate, location.pathname]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {saludo && <p className="mb-1 text-lg text-muted">{saludo}</p>}
      <PageHeader title="Mis salas" description="Aquí verás las salas de estudio que crees." />

      <div role="status" className={mostrarBienvenida ? 'mb-6' : undefined}>
        {mostrarBienvenida && (
          <Alert tone="success" title="¡Bienvenido a Salón de Estudio!">
            Tu cuenta está lista.
          </Alert>
        )}
      </div>

      <Card className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon name="home" className="size-8" />
        </span>
        <h2 className="text-xl font-bold">Aún no tienes salas</h2>
        <p className="max-w-md text-muted">
          Cuando crees una sala, aparecerá aquí con su nombre y su código para invitar a tu grupo.
        </p>
      </Card>
    </div>
  );
}