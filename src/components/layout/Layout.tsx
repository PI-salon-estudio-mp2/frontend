import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';

/**
 * Estructura común de todas las pantallas:
 * enlace "Saltar al contenido" + encabezado + <main> + pie de página.
 */
export function Layout() {
  const { pathname } = useLocation();
  const primeraCarga = useRef(true);

  // En una SPA el navegador no anuncia el cambio de página: movemos el foco
  // al <h1> de la nueva pantalla para que teclado y lector de pantalla lo noten.
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const main = document.getElementById('contenido');
    const destino = main?.querySelector<HTMLElement>('h1') ?? main;
    destino?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-xl bg-ink px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido principal
      </a>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
