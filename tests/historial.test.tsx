import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Chat } from '../src/features/sala/Chat';
import { LIMITE_HISTORIAL, type Mensaje } from '../src/features/tiempo-real/contrato';

const msg = (i: number): Mensaje => ({
  id: `m${String(i).padStart(3, '0')}`, salaId: 'K7P2QX9M', autorUid: 'luis', autorUsername: 'luis',
  texto: `Mensaje ${i}`, creadoEn: new Date(Date.UTC(2026, 10, 21, 12, 0, i)).toISOString(),
});
const pagina = (desde: number, hasta: number) => Array.from({ length: hasta - desde }, (_, k) => msg(desde + k));
const enviar = vi.fn();

afterEach(cleanup);

it('con un historial extenso ofrece cargar los mensajes anteriores', () => {
  const cargar = vi.fn();
  render(<Chat mensajes={pagina(50, 100)} miUid="ana" conectado enviar={enviar}
    anteriores={{ hayMas: true, cargando: false }} onCargarAnteriores={cargar} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cargar mensajes anteriores' }));
  expect(cargar).toHaveBeenCalledTimes(1);
});

it('muestra el estado de carga y no vuelve a pedir mientras carga', () => {
  const cargar = vi.fn();
  render(<Chat mensajes={pagina(50, 100)} miUid="ana" conectado enviar={enviar}
    anteriores={{ hayMas: true, cargando: true }} onCargarAnteriores={cargar} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cargando mensajes anteriores…' }));
  expect(cargar).not.toHaveBeenCalled();
});

it('avisa cuando ya se llegó al inicio de la conversación', () => {
  render(<Chat mensajes={pagina(0, LIMITE_HISTORIAL)} miUid="ana" conectado enviar={enviar}
    anteriores={{ hayMas: false, cargando: false }} />);
  expect(screen.getByText('Este es el inicio de la conversación.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Cargar mensajes anteriores/ })).toBeNull();
});

it('al cargar mensajes anteriores no salta la lectura ni muestra «Mensajes nuevos»', () => {
  const props = { miUid: 'ana', conectado: true, enviar, anteriores: { hayMas: true, cargando: false } };
  const { rerender } = render(<Chat mensajes={pagina(50, 100)} {...props} />);
  const lista = screen.getByLabelText('Mensajes de la sala');
  Object.defineProperty(lista, 'scrollHeight', { configurable: true, get: () => (lista.querySelectorAll('li').length * 40) });
  Object.defineProperty(lista, 'clientHeight', { configurable: true, value: 300 });
  lista.scrollTop = 0;
  fireEvent.scroll(lista);
  rerender(<Chat mensajes={[...pagina(0, 50), ...pagina(50, 100)]} {...props} />);
  // Se agregaron 50 mensajes de 40 px arriba: la lectura se corre la misma altura.
  expect(lista.scrollTop).toBe(2000);
  expect(screen.queryByRole('button', { name: /Mensajes nuevos/ })).toBeNull();
});

it('si falla la carga de anteriores lo explica', () => {
  render(<Chat mensajes={pagina(50, 100)} miUid="ana" conectado enviar={enviar}
    anteriores={{ hayMas: true, cargando: false, error: 'No pudimos cargar los mensajes anteriores. Inténtalo de nuevo.' }} />);
  expect(screen.getByText(/No pudimos cargar los mensajes anteriores/)).toBeTruthy();
});
