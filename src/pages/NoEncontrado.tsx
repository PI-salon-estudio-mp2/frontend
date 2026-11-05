import { useLocation } from 'react-router';
import { ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

function Ilustracion404() {
  return (
    <svg viewBox="0 0 240 200" className="w-full max-w-xs" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="180" rx="88" ry="10" fill="#e3e6f0" />
      <rect x="44" y="40" width="152" height="120" rx="18" fill="#ffffff" stroke="#c9cdf0" strokeWidth="3" />
      <rect x="44" y="40" width="152" height="28" rx="18" fill="#eef0ff" />
      <circle cx="64" cy="54" r="5" fill="#9aa3e8" />
      <circle cx="80" cy="54" r="5" fill="#9aa3e8" />
      <circle cx="96" cy="54" r="5" fill="#9aa3e8" />
      <text
        x="120"
        y="128"
        textAnchor="middle"
        fontFamily="inherit"
        fontWeight="700"
        fontSize="44"
        fill="#3346d3"
      >
        404
      </text>
      <circle cx="186" cy="38" r="22" fill="#ffd34d" />
      <path d="M180 32c2-4 10-4 12 0s-6 6-6 10" stroke="#1b1f3b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="186" cy="48" r="2" fill="#1b1f3b" />
    </svg>
  );
}

export function NoEncontrado() {
  usePageTitle('Página no encontrada');
  const { pathname } = useLocation();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1fr_auto] md:items-center">
      <div className="max-w-xl">
        <p className="mb-2 text-sm font-bold tracking-wide text-primary-700 uppercase">Error 404</p>
        <h1 tabIndex={-1} className="text-3xl leading-tight font-bold outline-none sm:text-4xl">
          No encontramos esta página
        </h1>
        <p className="mt-4 text-lg text-muted">
          La dirección <code className="rounded-md bg-primary-50 px-1.5 py-0.5 break-all text-ink">{pathname}</code>{' '}
          no existe o cambió de lugar. Revisa que esté bien escrita o sigue por uno de estos caminos:
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to={RUTAS.inicio}>
            <Icon name="home" />
            Ir al inicio
          </ButtonLink>
          <ButtonLink to={RUTAS.unirseSala} variant="secondary">
            <Icon name="door" />
            Unirme a una sala
          </ButtonLink>
        </div>
      </div>
      <div className="flex justify-center">
        <Ilustracion404 />
      </div>
    </div>
  );
}
