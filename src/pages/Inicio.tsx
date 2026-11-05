import { ButtonLink } from '../components/ui/Button';
import { Icon, type IconName } from '../components/ui/Icon';
import { DatoBaseCard } from '../features/base-tecnica/DatoBaseCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { RUTAS } from '../routes/rutas';

const FUNCIONES: { icono: IconName; titulo: string; texto: string }[] = [
  {
    icono: 'lock',
    titulo: 'Salas privadas',
    texto: 'Crea tu sala, comparte su código y estudia solo con quien invites.',
  },
  {
    icono: 'chat',
    titulo: 'Chat en tiempo real',
    texto: 'Mensajes al instante y un historial que no se pierde si te desconectas.',
  },
  {
    icono: 'video',
    titulo: 'Video y audio',
    texto: 'Mírense y escúchense como en un salón, con control de cámara y micrófono.',
  },
  {
    icono: 'screen',
    titulo: 'Compartir pantalla',
    texto: 'Presenta tus apuntes o un documento a todo el grupo en un clic.',
  },
];

export function Inicio() {
  usePageTitle('Inicio');

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-primary-50"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
              <Icon name="users" className="size-4" />
              Estudio colaborativo en tiempo real
            </p>
            <h1 tabIndex={-1} className="text-4xl leading-[1.1] font-bold text-ink outline-none sm:text-5xl">
              Tu salón de estudio, donde estés.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Reúnete con tu grupo en una sala privada: conversen por chat, véanse por video y compartan la
              pantalla sin instalar nada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to={RUTAS.registro}>
                Crear cuenta gratis
                <Icon name="arrowRight" />
              </ButtonLink>
              <ButtonLink to={RUTAS.unirseSala} variant="secondary">
                <Icon name="door" />
                Unirme con un código
              </ButtonLink>
            </div>
          </div>

          <DatoBaseCard />
        </div>
      </section>

      <section aria-labelledby="funciones-titulo" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 id="funciones-titulo" className="text-2xl font-bold sm:text-3xl">
          Todo lo que necesita tu grupo
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          Diseñado para usarse con teclado y con lector de pantalla desde el primer día.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCIONES.map((f) => (
            <li key={f.titulo} className="rounded-card border border-line bg-surface p-6">
              <span className="grid size-12 place-items-center rounded-xl bg-primary-600 text-white">
                <Icon name={f.icono} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{f.titulo}</h3>
              <p className="mt-2 text-muted">{f.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
