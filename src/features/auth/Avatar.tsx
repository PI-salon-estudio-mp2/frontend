import { useState } from 'react';
import { colorAvatar } from './avatares';

interface AvatarProps {
  /** Id de un avatar de color («azul») o URL https de una foto (cuenta de Google). */
  id: string;
  iniciales: string;
  className?: string;
}

/** Avatar decorativo: el nombre del usuario siempre va escrito al lado. */
export function Avatar({ id, iniciales, className = 'size-9 text-base' }: AvatarProps) {
  const [fallo, setFallo] = useState(false);
  const esFoto = /^https:\/\//i.test(id);

  if (esFoto && !fallo) {
    return (
      <img
        src={id}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={() => setFallo(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: colorAvatar(esFoto ? '' : id) }}
    >
      {iniciales}
    </span>
  );
}