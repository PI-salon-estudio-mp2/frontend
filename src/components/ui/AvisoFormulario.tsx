import { Alert } from './Alert';

/** Mensaje de error general del formulario (no ligado a un campo). */
export function AvisoFormulario({ mensaje, titulo }: { mensaje?: string; titulo?: string }) {
  return (
    <div role="alert" className={mensaje ? 'mb-6' : undefined}>
      {mensaje && <Alert tone="danger" title={titulo ?? mensaje}>{titulo ? mensaje : undefined}</Alert>}
    </div>
  );
}
