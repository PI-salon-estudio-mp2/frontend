import { Link } from 'react-router';
import { APP_NAME } from '../../config/app';
import { RUTAS } from '../../routes/rutas';

export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#3346d3" />
      <path d="M8 11.5c2.6-1.4 5.3-1.4 8 0v11c-2.7-1.4-5.4-1.4-8 0z" fill="#ffffff" />
      <path d="M16 11.5c2.7-1.4 5.4-1.4 8 0v11c-2.6-1.4-5.3-1.4-8 0z" fill="#c9cdf0" />
      <circle cx="16" cy="7" r="2" fill="#ffd34d" />
    </svg>
  );
}

export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link
      to={RUTAS.inicio}
      className={`inline-flex items-center gap-2.5 rounded-lg text-lg font-bold ${
        tone === 'dark' ? 'text-ink' : 'text-white'
      }`}
    >
      <LogoMark />
      <span>
        {APP_NAME}
        <span className="sr-only">, ir al inicio</span>
      </span>
    </Link>
  );
}
