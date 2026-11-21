import { useId } from 'react';
import { Avatar } from '../auth/Avatar';
import type { UsuarioConectado } from '../tiempo-real/contrato';

interface ParticipantesProps {
  presentes: UsuarioConectado[];
  miUid: string;
  anfitrionUid: string;
}

/** Lista de quienes están conectados ahora en la sala (US-10). El anfitrión y «tú» van primero. */
export function Participantes({ presentes, miUid, anfitrionUid }: ParticipantesProps) {
  const idTitulo = useId();
  const ordenados = [...presentes].sort((a, b) => {
    const peso = (u: UsuarioConectado) => (u.uid === anfitrionUid ? 0 : u.uid === miUid ? 1 : 2);
    return peso(a) - peso(b) || a.username.localeCompare(b.username, 'es');
  });

  return (
    <section aria-labelledby={idTitulo} className="rounded-card border border-line bg-surface p-5">
      <h2 id={idTitulo} className="text-lg font-bold text-ink">
        Participantes <span className="font-normal text-muted">({presentes.length} conectados)</span>
      </h2>
      {ordenados.length === 0 ? (
        <p className="mt-3 text-muted">Cargando participantes…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ordenados.map((u) => (
            <li key={u.uid} className="flex items-center gap-3">
              <Avatar id={u.avatar} iniciales={u.username.slice(0, 2).toUpperCase()} className="size-8 text-sm" />
              <span className="min-w-0 wrap-anywhere font-bold text-ink">
                @{u.username}
                {u.uid === miUid && <span className="font-normal text-muted"> (tú)</span>}
              </span>
              {u.uid === anfitrionUid && (
                <span className="ml-auto shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-700 ring-1 ring-primary-200">
                  Anfitrión
                </span>
              )}
              <span className="sr-only">, conectado</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
