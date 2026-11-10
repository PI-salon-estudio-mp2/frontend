import { colorAvatar } from './avatares';

interface AvatarProps {
  id: string;
  iniciales: string;
  className?: string;
}

/** Avatar decorativo: el nombre del usuario siempre va escrito al lado. */
export function Avatar({ id, iniciales, className = 'size-9 text-base' }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: colorAvatar(id) }}
    >
      {iniciales}
    </span>
  );
}