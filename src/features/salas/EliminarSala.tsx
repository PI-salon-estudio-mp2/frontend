import { useId, useRef, useState } from 'react';
import { AvisoFormulario } from '../../components/ui/AvisoFormulario';
import { Button, type ButtonSize } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { toApiError } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useTiempoRealOpcional } from '../tiempo-real/contexto';
import { eliminarSala } from './api';

interface EliminarSalaProps {
  sala: { id: string; nombre: string };
  /** Se llama cuando la API confirmó el borrado (204). */
  onEliminada: (nombre: string) => void;
  size?: ButtonSize;
}

/**
 * US-07 · Eliminar sala (solo el anfitrión: quien no lo es no ve este botón y la API responde 403).
 * Pide confirmación en un modal con el foco atrapado; Esc o «Cancelar» cierran y el foco vuelve al botón.
 */
export function EliminarSala({ sala, onEliminada, size = 'sm' }: EliminarSalaProps) {
  const { obtenerToken } = useAuth();
  const tiempoReal = useTiempoRealOpcional();
  const idTitulo = useId();
  const idDetalle = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const disparador = useRef<HTMLButtonElement | null>(null);
  const ocupado = useRef(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string>();

  const cerrar = () => {
    if (ocupado.current) return;
    dialogo.current?.close();
    disparador.current?.focus();
  };

  const confirmar = async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    setEliminando(true);
    setError(undefined);
    try {
      const token = await obtenerToken();
      await eliminarSala(sala.id, token);
      // Avisa a quienes están dentro para que vuelvan a su panel.
      tiempoReal?.avisarSalaEliminada(sala.id);
      ocupado.current = false;
      dialogo.current?.close();
      onEliminada(sala.nombre);
    } catch (e) {
      const fallo = toApiError(e);
      setError(fallo.status === 403
        ? 'Solo el anfitrión puede eliminar esta sala.'
        : fallo.status === 404
          ? 'Esta sala ya no existe. Vuelve a «Mis salas» para ver tu lista actualizada.'
          : `No pudimos eliminar la sala. ${fallo.message}`);
    } finally {
      ocupado.current = false;
      setEliminando(false);
    }
  };

  return (
    <>
      <Button
        variant="dangerSecondary"
        size={size}
        aria-label={`Eliminar la sala ${sala.nombre}`}
        onClick={(event) => {
          disparador.current = event.currentTarget;
          setError(undefined);
          dialogo.current?.showModal();
        }}
      >
        Eliminar
      </Button>
      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        aria-describedby={idDetalle}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 text-ink shadow-xl backdrop:bg-black/60"
        onCancel={(event) => { event.preventDefault(); cerrar(); }}
      >
        <h2 id={idTitulo} className="flex items-start gap-3 text-xl font-bold text-danger-700">
          <Icon name="alert" className="mt-0.5 size-6 shrink-0" />
          <span className="wrap-anywhere">¿Eliminar la sala «{sala.nombre}»?</span>
        </h2>
        <div id={idDetalle} className="my-4 space-y-3">
          <ul className="list-disc space-y-2 pl-6">
            <li>Se borrarán la sala y todos sus mensajes.</li>
            <li>Quienes estén dentro recibirán un aviso y volverán a su panel.</li>
            <li>El ID <code className="font-bold">{sala.id}</code> dejará de funcionar.</li>
          </ul>
          <p className="font-bold text-danger-700">Esta acción no se puede deshacer.</p>
        </div>
        <AvisoFormulario mensaje={error} />
        <p role="status" className="my-3">{eliminando ? 'Eliminando sala…' : ''}</p>
        <div className="flex flex-wrap gap-3" aria-busy={eliminando}>
          <Button autoFocus variant="secondary" aria-disabled={eliminando} onClick={cerrar}>Cancelar</Button>
          <Button variant="danger" aria-disabled={eliminando} onClick={() => void confirmar()}>
            {eliminando ? 'Eliminando…' : 'Sí, eliminar sala'}
          </Button>
        </div>
      </dialog>
    </>
  );
}
