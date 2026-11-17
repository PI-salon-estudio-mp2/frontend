import { useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { AvisoFormulario } from '../../components/ui/AvisoFormulario';
import { toApiError } from '../../lib/api';
import { useAuth } from './AuthContext';

export function EliminarCuenta({ disabled }: { disabled: boolean }) {
  const { eliminarCuenta, estado } = useAuth();
  const username = estado.status === 'autenticado' ? estado.perfil.username : '';
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
      await eliminarCuenta();
    } catch (e) {
      const fallo = toApiError(e);
      setError(fallo.kind === 'network' || fallo.kind === 'timeout' || fallo.kind === 'format'
        ? 'No pudimos confirmar la eliminación. Comprueba tu conexión y reintenta para verificar el resultado.'
        : `No se pudo eliminar la cuenta. ${fallo.message}`);
    } finally {
      ocupado.current = false;
      setEliminando(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-danger-700 p-6" aria-labelledby="eliminar-cuenta-titulo">
      <h2 id="eliminar-cuenta-titulo" className="text-xl font-bold text-danger-700">Eliminar cuenta</h2>
      <p className="mb-4 mt-2 text-muted">Elimina definitivamente tu cuenta y tus datos personales. Esta acción no se puede deshacer.</p>
      <Button variant="danger" disabled={disabled} onClick={(event) => {
        disparador.current = event.currentTarget;
        setError(undefined);
        dialogo.current?.showModal();
      }}>Eliminar cuenta</Button>
      <dialog ref={dialogo} aria-labelledby="confirmar-eliminacion-titulo" aria-describedby="consecuencias-eliminacion"
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 text-ink shadow-xl backdrop:bg-black/60"
        onCancel={(event) => { event.preventDefault(); cerrar(); }}>
        <h2 id="confirmar-eliminacion-titulo" className="flex items-start gap-3 text-xl font-bold text-danger-700">
          <Icon name="alert" className="mt-0.5 size-6 shrink-0" />
          <span>¿Deseas eliminar tu cuenta definitivamente?</span>
        </h2>
        <div id="consecuencias-eliminacion" className="my-4 space-y-3">
          <p>Perderás el acceso a tu cuenta y esto sera lo que pasará:</p>
          <p>Se borrarán tu perfil y tus datos personales.</p> 
          <p>Tu nombre de usuario <strong className="break-words">@{username}</strong> quedará disponible para otras personas.</p>
          <p>Se eliminarán las salas que creaste y todo su contenido, así como tus mensajes en otras salas.</p> 
          <p>Dejarás de participar en las salas de otras personas.</p>
        </div>
        <h2 id="mensaje-de-advertencia" className="text-l font-bold text-danger-700">Esta acción no se puede deshacer</h2>
        <AvisoFormulario mensaje={error} />
        <p role="status" className="my-3">{eliminando ? 'Eliminando cuenta…' : ''}</p>
        <div className="flex flex-wrap gap-3" aria-busy={eliminando}>
          <Button autoFocus variant="secondary" aria-disabled={eliminando} onClick={cerrar}>Cancelar</Button>
          <Button variant="danger" className="focus-visible:outline-danger-700" aria-disabled={eliminando} onClick={() => void confirmar()}>Si, eliminar definitivamente</Button>
        </div>
      </dialog>
    </section>
  );
}
