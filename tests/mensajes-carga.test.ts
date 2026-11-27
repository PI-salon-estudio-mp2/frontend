import { expect, it } from 'vitest';
import { ApiError, mensajeErrorCarga } from '../src/lib/api';

// #38: cuando falla la carga, el estudiante ve qué hacer y no un texto técnico.
it('traduce los fallos de carga a mensajes que el estudiante entiende', () => {
  expect(mensajeErrorCarga(new ApiError('network', 'x'))).toBe('Revisa tu conexión a internet e inténtalo de nuevo.');
  expect(mensajeErrorCarga(new ApiError('timeout', 'x'))).toMatch(/tardando en responder/);
  expect(mensajeErrorCarga(new ApiError('http', 'x', 401))).toMatch(/Tu sesión expiró/);
  for (const error of [
    new ApiError('http', 'La dirección del servicio no existe.', 404, 'ROUTE_NOT_FOUND'),
    new ApiError('http', 'Todavía no hay un dato guardado en la base de datos.', 404, 'NOT_FOUND'),
    new ApiError('http', 'El servidor tuvo un problema.', 500),
    new ApiError('format', 'La respuesta del servidor no tiene el formato esperado.'),
  ]) {
    const texto = mensajeErrorCarga(error);
    expect(texto).toMatch(/^Revisa tu conexión e inténtalo de nuevo/);
    expect(texto).not.toMatch(/dirección del servicio|base de datos|formato/);
  }
});
