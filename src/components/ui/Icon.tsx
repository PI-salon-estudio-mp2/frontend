import type { SVGProps } from 'react';

/** Íconos de línea (24×24, trazo 2). Son decorativos: el texto vecino da el significado. */
const PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  arrowLeft: 'M19 12H5m6-6l-6 6 6 6',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  refresh: 'M20 11a8 8 0 10-2.34 5.66M20 4v7h-7',
  alert: 'M12 8v5m0 3.5v.5M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  check: 'M20 6L9 17l-5-5',
  database:
    'M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3zm0 0v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3',
  users:
    'M16 20v-1.5A3.5 3.5 0 0012.5 15h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm10 9v-1.5a3.5 3.5 0 00-2.5-3.35M15 4.15a3.5 3.5 0 010 6.7',
  chat: 'M21 12a8 8 0 01-11.6 7.14L4 20.5l1.36-5.4A8 8 0 1121 12z',
  video: 'M15 10l5-3v10l-5-3M4 6h11v12H4z',
  screen: 'M3 4h18v12H3zM8 20h8M12 16v4',
  door: 'M14 3H6v18h8m-1-9h8m-3-3l3 3-3 3',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 118 0v4',
  user: 'M20 21v-1.5a4.5 4.5 0 00-4.5-4.5h-7A4.5 4.5 0 004 19.5V21M12 11a4 4 0 100-8 4 4 0 000 8z',
  home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  plus: 'M12 5v14M5 12h14',
  accessibility: 'M12 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 8l7 2 7-2M12 10v4m0 0l-3 7m3-7l3 7',
  compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zm3.5-12.5l-2 5-5 2 2-5z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v4l3 2',
  tool: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.8-.7-.7-2.8z',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
}

export function Icon({ name, className = 'size-5', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
