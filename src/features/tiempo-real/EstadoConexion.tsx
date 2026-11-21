import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Spinner } from '../../components/ui/Spinner';
import { mensajeDeError } from './contrato';
import type { Conexion } from './TiempoRealContext';

/**
 * Aviso del estado de la conexión en tiempo real. Vive en una región role="status"
 * persistente para que el lector de pantalla lo anuncie sin mover el foco.
 */
export function EstadoConexion({ conexion, onReintentar }: { conexion: Conexion; onReintentar: () => void }) {
  return (
    <div role="status" aria-atomic="true" className={conexion.estado === 'conectado' || conexion.estado === 'inactivo' ? undefined : 'mb-6'}>
      {conexion.estado === 'conectando' && (
        <p className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 font-bold text-ink">
          <Spinner className="size-5" />
          <span>
            Conectando…
            <span className="block text-sm font-normal text-muted">
              La primera conexión del día puede tardar hasta un minuto.
            </span>
          </span>
        </p>
      )}
      {conexion.estado === 'reconectando' && (
        <Alert tone="warning" title="Desconectado, reintentando…">
          Perdimos la conexión con el servidor. Volveremos a conectarte solos en cuanto sea posible.
        </Alert>
      )}
      {conexion.estado === 'error' && conexion.error && (
        <Alert
          tone="danger"
          title="No pudimos conectarte"
          actions={conexion.error.code === 'SIN_CONFIGURAR' ? undefined : (
            <Button onClick={onReintentar}><Icon name="refresh" />Reintentar</Button>
          )}
        >
          {mensajeDeError(conexion.error)}
        </Alert>
      )}
    </div>
  );
}
