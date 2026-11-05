import { useParams } from 'react-router';
import { PaginaPendiente } from './PaginaPendiente';

export function Sala() {
  const { id = '' } = useParams();

  return (
    <PaginaPendiente
      titulo="Sala de estudio"
      descripcion="El espacio donde tu grupo conversa, se ve y comparte la pantalla."
      historias="Sprints 3 a 5 · US-09 a US-14"
      sprint={3}
      icono="users"
      incluira={[
        'Chatear en tiempo real y recuperar el historial.',
        'Ver la cuadrícula de participantes con su cámara y micrófono.',
        'Silenciar tu micrófono, apagar tu cámara y compartir tu pantalla.',
      ]}
    >
      <p className="mt-6 rounded-xl bg-canvas px-4 py-3 text-sm">
        <span className="font-bold">ID solicitado:</span> <code className="break-all">{id}</code>
      </p>
    </PaginaPendiente>
  );
}
