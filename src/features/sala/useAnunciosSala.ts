import { useEffect, useRef, useState } from 'react';
import type { Mensaje, UsuarioConectado } from '../tiempo-real/contrato';
import { horaMensaje } from './formato';

const MAX_ANUNCIOS = 5;

/**
 * Anuncios para el lector de pantalla (WCAG 4.1.3): mensajes nuevos de otras personas
 * y quién entra o sale. Se muestran en una región role="log", sin mover el foco.
 * El historial que llega al entrar no se anuncia: solo lo que pasa después.
 */
export function useAnunciosSala(mensajes: Mensaje[], presentes: UsuarioConectado[], miUid: string, lista: boolean) {
  const [anuncios, setAnuncios] = useState<{ id: number; texto: string }[]>([]);
  const vistos = useRef<Set<string> | null>(null);
  const conectados = useRef<Map<string, string> | null>(null);
  const contador = useRef(0);

  function anunciar(textos: string[]) {
    if (textos.length === 0) return;
    setAnuncios((actuales) => [
      ...actuales,
      ...textos.map((texto) => ({ id: ++contador.current, texto })),
    ].slice(-MAX_ANUNCIOS));
  }

  useEffect(() => {
    if (!lista) return;
    if (vistos.current === null) {
      vistos.current = new Set(mensajes.map((m) => m.id));
      return;
    }
    const nuevos = mensajes.filter((m) => !vistos.current!.has(m.id));
    nuevos.forEach((m) => vistos.current!.add(m.id));
    anunciar(nuevos
      .filter((m) => m.autorUid !== miUid)
      .map((m) => `Mensaje de @${m.autorUsername || 'usuario'}, ${horaMensaje(m.creadoEn)}: ${m.texto}`));
  }, [mensajes, miUid, lista]);

  useEffect(() => {
    if (!lista) return;
    const ahora = new Map(presentes.map((u) => [u.uid, u.username]));
    const antes = conectados.current;
    conectados.current = ahora;
    if (antes === null) return;
    const textos: string[] = [];
    for (const [uid, username] of ahora) if (!antes.has(uid) && uid !== miUid) textos.push(`@${username} entró a la sala`);
    for (const [uid, username] of antes) if (!ahora.has(uid) && uid !== miUid) textos.push(`@${username} salió de la sala`);
    anunciar(textos);
  }, [presentes, miUid, lista]);

  return anuncios;
}
