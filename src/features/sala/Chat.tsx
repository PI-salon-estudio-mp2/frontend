import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Spinner } from '../../components/ui/Spinner';
import { mensajeDeError, type Mensaje, type Respuesta } from '../tiempo-real/contrato';
import { fechaCompleta, horaMensaje } from './formato';

export const MAX_MENSAJE = 1000;
/** A cuántos píxeles del final se considera que la persona está «abajo» del chat. */
const UMBRAL_ABAJO_PX = 80;

interface ChatProps {
  mensajes: Mensaje[];
  miUid: string;
  conectado: boolean;
  enviar: (texto: string) => Promise<Respuesta<Mensaje>>;
}

/**
 * Chat de la sala (US-10). Enter envía y Shift+Enter hace salto de línea; no se envían
 * mensajes vacíos. Baja solo al llegar mensajes, salvo que la persona esté leyendo el
 * historial: en ese caso aparece «Mensajes nuevos» y no se le mueve la lectura.
 */
export function Chat({ mensajes, miUid, conectado, enviar }: ChatProps) {
  const idTitulo = useId();
  const idCampo = useId();
  const idAyuda = useId();
  const idError = useId();
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const pegadoAbajo = useRef(true);
  const cantidadAnterior = useRef(0);
  const [nuevosSinLeer, setNuevosSinLeer] = useState(0);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  function bajarAlFinal(suave = false) {
    const el = lista.current;
    if (!el) return;
    el.scrollTo?.({ top: el.scrollHeight, behavior: suave ? 'smooth' : 'auto' });
    pegadoAbajo.current = true;
    setNuevosSinLeer(0);
  }

  function alDesplazar() {
    const el = lista.current;
    if (!el) return;
    pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < UMBRAL_ABAJO_PX;
    if (pegadoAbajo.current) setNuevosSinLeer(0);
  }

  // Auto-scroll al llegar mensajes, sin interrumpir a quien lee mensajes anteriores.
  useLayoutEffect(() => {
    const llegaron = mensajes.length - cantidadAnterior.current;
    const primeraCarga = cantidadAnterior.current === 0;
    cantidadAnterior.current = mensajes.length;
    if (llegaron <= 0) return;
    const ultimoEsMio = mensajes[mensajes.length - 1]?.autorUid === miUid;
    if (primeraCarga || pegadoAbajo.current || ultimoEsMio) bajarAlFinal();
    else setNuevosSinLeer((n) => n + llegaron);
  }, [mensajes, miUid]);

  useEffect(() => { if (conectado) setError(undefined); }, [conectado]);

  async function mandar(event?: FormEvent) {
    event?.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return; // Mensaje vacío o solo espacios: no se envía.
    if (limpio.length > MAX_MENSAJE) {
      setError(`Usa máximo ${MAX_MENSAJE} caracteres por mensaje.`);
      return;
    }
    setEnviando(true);
    setError(undefined);
    const respuesta = await enviar(limpio);
    setEnviando(false);
    if (respuesta.ok) {
      setTexto('');
      campo.current?.focus();
    } else {
      // El borrador se conserva para poder reintentar.
      setError(mensajeDeError(respuesta.error));
    }
  }

  function alTeclear(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void mandar();
    }
  }

  const vacio = texto.trim() === '';
  const restantes = MAX_MENSAJE - texto.length;

  return (
    <section aria-labelledby={idTitulo} className="flex min-h-0 flex-col rounded-card border border-line bg-surface">
      <h2 id={idTitulo} className="border-b border-line px-5 py-4 text-lg font-bold text-ink">Chat</h2>

      <div className="relative">
        <div
          ref={lista}
          onScroll={alDesplazar}
          tabIndex={0}
          aria-label="Mensajes de la sala"
          className="h-[min(55vh,32rem)] overflow-y-auto px-5 py-4"
        >
          {mensajes.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-muted">
              <div>
                <Icon name="chat" className="mx-auto mb-3 size-8 text-primary-600" />
                <p className="font-bold text-ink">Aún no hay mensajes en esta sala</p>
                <p className="mt-1">Escribe el primero para empezar la conversación.</p>
              </div>
            </div>
          ) : (
            <ol className="space-y-3">
              {mensajes.map((m) => <ItemMensaje key={m.id} mensaje={m} mio={m.autorUid === miUid} />)}
            </ol>
          )}
        </div>
        {nuevosSinLeer > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Button size="sm" className="pointer-events-auto shadow-md" onClick={() => bajarAlFinal(true)}>
              <Icon name="arrowRight" className="size-4 rotate-90" />
              {nuevosSinLeer === 1 ? 'Mensajes nuevos (1)' : `Mensajes nuevos (${nuevosSinLeer})`}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={(e) => void mandar(e)} noValidate className="border-t border-line p-4">
        <label htmlFor={idCampo} className="mb-1.5 block font-bold text-ink">Escribe un mensaje</label>
        <p id={idAyuda} className="mb-2 text-sm text-muted">
          Enter envía · Shift + Enter hace un salto de línea
          {restantes < 100 && <span className={restantes < 0 ? ' font-bold text-danger-700' : ''}> · Te quedan {restantes} caracteres</span>}
        </p>
        <div className="flex items-end gap-3">
          <textarea
            ref={campo}
            id={idCampo}
            rows={2}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setError(undefined); }}
            onKeyDown={alTeclear}
            aria-describedby={error ? `${idAyuda} ${idError}` : idAyuda}
            aria-invalid={error ? true : undefined}
            placeholder={conectado ? 'Escribe aquí…' : 'Esperando la conexión…'}
            className={`max-h-40 min-h-11 w-full resize-y rounded-xl border bg-surface px-4 py-2.5 text-base text-ink ${error ? 'border-danger-700 ring-1 ring-danger-700' : 'border-field-border'}`}
          />
          <Button type="submit" aria-disabled={vacio || enviando || !conectado} className="shrink-0">
            {enviando ? <Spinner className="size-5 text-current" /> : <Icon name="arrowRight" className="size-5" />}
            {enviando ? 'Enviando…' : 'Enviar'}
          </Button>
        </div>
        <div role="alert">
          {error && (
            <p id={idError} className="mt-2 flex items-start gap-2 text-sm font-bold text-danger-700">
              <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function ItemMensaje({ mensaje, mio }: { mensaje: Mensaje; mio: boolean }) {
  const autor = mensaje.autorUid === null ? 'Usuario eliminado' : `@${mensaje.autorUsername}`;
  return (
    <li className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
      {/* Orden de lectura: autor, hora y texto. */}
      <article className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${mio ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-canvas ring-1 ring-line'}`}>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-bold text-ink">{mio ? `${autor} (tú)` : autor}</span>
          <time dateTime={mensaje.creadoEn} title={fechaCompleta(mensaje.creadoEn)} className="text-muted">
            {horaMensaje(mensaje.creadoEn)}
          </time>
        </p>
        <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-ink">{mensaje.texto}</p>
      </article>
    </li>
  );
}
