import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { NAV_PRINCIPAL, RUTAS } from '../../routes/rutas';
import { ButtonLink } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Logo } from './Logo';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-xl px-3.5 font-bold transition-[color,background-color] ${
    isActive ? 'bg-primary-50 text-primary-700' : 'text-muted hover:bg-primary-50 hover:text-ink'
  }`;

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const botonMenuRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

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
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <ButtonLink to={RUTAS.ingresar} variant="ghost">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink to={RUTAS.registro} variant="primary">
            Crear cuenta
          </ButtonLink>
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
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={(s: { isActive: boolean }) => `${navLinkClass(s)} w-full`}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <ButtonLink to={RUTAS.ingresar} variant="secondary">
              Iniciar sesión
            </ButtonLink>
            <ButtonLink to={RUTAS.registro} variant="primary">
              Crear cuenta
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
