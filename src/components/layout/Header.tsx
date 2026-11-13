import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { Avatar } from '../../features/auth/Avatar';
import { useAuth } from '../../features/auth/AuthContext';
import { NAV_PRIVADA, NAV_PUBLICA, RUTAS } from '../../routes/rutas';
import { Button, ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-xl px-3.5 font-bold transition-[color,background-color] ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-muted hover:bg-primary-50 hover:text-ink'
  }`;

/** Parte del encabezado que cambia según haya sesión o no. */
function AccionesSesion({ movil }: { movil: boolean }) {
  const { estado, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await cerrarSesion();
    navigate(RUTAS.ingresar, { replace: true, state: { sesionCerrada: true } });
  };

  if (estado.status === 'cargando') return null;

  if (estado.status === 'anonimo') {
    return (
      <>
        <ButtonLink to={RUTAS.ingresar} variant={movil ? 'secondary' : 'ghost'}>
          Iniciar sesión
        </ButtonLink>
        <ButtonLink to={RUTAS.registro} variant="secondary">
          Crear cuenta
        </ButtonLink>
      </>
    );
  }

  return (
    <>
      {estado.status === 'autenticado' && (
        <span className="flex items-center gap-2 font-bold text-ink">
          <Avatar
            id={estado.perfil.avatar}
            iniciales={estado.perfil.username.charAt(0).toUpperCase()}
          />
          <span>@{estado.perfil.username}</span>
        </span>
      )}
      <Button variant="secondary" onClick={() => void salir()}>
        Cerrar sesión
      </Button>
    </>
  );
}

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenuRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const { estado } = useAuth();
  const items = estado.status === 'autenticado' ? NAV_PRIVADA : NAV_PUBLICA;

  // Al cambiar de página se cierra el menú móvil.
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Esc cierra el menú y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    if (!menuAbierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuAbierto]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-18">
        <Logo />

        <nav aria-label="Principal" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <AccionesSesion movil={false} />
        </div>

        <button
          ref={botonMenuRef}
          type="button"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-bold text-ink hover:bg-primary-50 lg:hidden"
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          onClick={() => setMenuAbierto((v) => !v)}
        >
          <Icon name={menuAbierto ? 'close' : 'menu'} className="size-6" />
          {menuAbierto ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <div id="menu-movil" hidden={!menuAbierto} className="border-t border-line bg-surface lg:hidden">
        <nav aria-label="Principal (móvil)" className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={(s: { isActive: boolean }) => `${navLinkClass(s)} w-full`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 items-center gap-3 border-t border-line pt-4">
            <AccionesSesion movil />
          </div>
        </nav>
      </div>
    </header>
  );
}