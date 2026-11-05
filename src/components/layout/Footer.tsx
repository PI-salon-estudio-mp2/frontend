import { Link } from 'react-router';
import { APP_NAME } from '../../config/app';
import { RUTAS } from '../../routes/rutas';
import { Logo } from './Logo';

const GRUPOS = [
  {
    titulo: 'Salas',
    enlaces: [
      { to: RUTAS.panel, label: 'Mis salas' },
      { to: RUTAS.crearSala, label: 'Crear una sala' },
      { to: RUTAS.unirseSala, label: 'Unirme a una sala' },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { to: RUTAS.ingresar, label: 'Iniciar sesión' },
      { to: RUTAS.registro, label: 'Crear cuenta' },
      { to: RUTAS.perfil, label: 'Mi perfil' },
    ],
  },
  {
    titulo: 'Ayuda',
    enlaces: [{ to: RUTAS.accesibilidad, label: 'Declaración de accesibilidad' }],
  },
];

export function Footer() {
  return (
    <footer className="on-dark mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-primary-200">
            Salas privadas para estudiar en grupo con chat, video y pantalla compartida en tiempo real.
          </p>
        </div>

        {GRUPOS.map((grupo) => (
          <nav key={grupo.titulo} aria-label={`Pie de página: ${grupo.titulo}`}>
            <h2 className="text-sm font-bold tracking-wide text-accent-300 uppercase">{grupo.titulo}</h2>
            <ul className="mt-3 space-y-1">
              {grupo.enlaces.map((e) => (
                <li key={e.to}>
                  <Link
                    to={e.to}
                    className="inline-flex min-h-10 items-center text-white underline-offset-4 hover:underline"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-primary-200 sm:px-6">
          © {new Date().getFullYear()} {APP_NAME} · Proyecto Integrador · Escuela de Ingeniería de
          Sistemas y Computación
        </p>
      </div>
    </footer>
  );
}
