import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Chat } from '../src/features/sala/Chat';
import { Participantes } from '../src/features/sala/Participantes';
import type { Mensaje, Respuesta } from '../src/features/tiempo-real/contrato';

const msg = (id: string, autorUid: string, texto: string, seg = 0): Mensaje => ({
  id, salaId: 'K7P2QX9M', autorUid, autorUsername: autorUid, texto, creadoEn: new Date(Date.UTC(2026, 10, 21, 15, 0, seg)).toISOString(),
});

afterEach(cleanup);

type Enviar = (texto: string) => Promise<Respuesta<Mensaje>>;

function montar(mensajes: Mensaje[], enviar = vi.fn<Enviar>(async (texto) => ({ ok: true, data: msg('n', 'ana', texto) }))) {
  const vista = render(<Chat mensajes={mensajes} miUid="ana" conectado enviar={enviar} />);
  return { ...vista, enviar };
}

const campo = () => screen.getByRole('textbox', { name: 'Escribe un mensaje' });

it('muestra un mensaje amigable si la sala no tiene mensajes', () => {
  montar([]);
  expect(screen.getByText('Aún no hay mensajes en esta sala')).toBeTruthy();
});

it('muestra cada mensaje con autor, hora y texto, en orden', () => {
  montar([msg('1', 'luis', 'Hola'), msg('2', 'ana', 'Qué más', 5)]);
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(2);
  expect(items[0].textContent).toMatch(/@luis.*Hola/);
  expect(items[1].textContent).toMatch(/@ana \(tú\).*Qué más/);
  expect(items[0].querySelector('time')?.getAttribute('dateTime')).toBe(msg('1', 'luis', '').creadoEn);
});

it('Enter envía el mensaje sin espacios de más y limpia el campo', async () => {
  const { enviar } = montar([]);
  fireEvent.change(campo(), { target: { value: '  Hola grupo  ' } });
  await act(async () => { fireEvent.keyDown(campo(), { key: 'Enter' }); });
  expect(enviar).toHaveBeenCalledWith('Hola grupo');
  expect((campo() as HTMLTextAreaElement).value).toBe('');
});

it('no envía mensajes vacíos o con solo espacios, y Shift+Enter no envía', async () => {
  const { enviar } = montar([]);
  fireEvent.change(campo(), { target: { value: '    ' } });
  await act(async () => { fireEvent.keyDown(campo(), { key: 'Enter' }); });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
  fireEvent.change(campo(), { target: { value: 'línea 1' } });
  await act(async () => { fireEvent.keyDown(campo(), { key: 'Enter', shiftKey: true }); });
  expect(enviar).not.toHaveBeenCalled();
});

it('si el envío falla conserva el borrador y explica el error', async () => {
  const enviar = vi.fn<Enviar>(async () => ({ ok: false, error: { code: 'DESCONECTADO', message: 'Sin conexión con el servidor: tu mensaje no se envió.' } }));
  montar([], enviar);
  fireEvent.change(campo(), { target: { value: 'Importante' } });
  await act(async () => { fireEvent.keyDown(campo(), { key: 'Enter' }); });
  expect(screen.getByRole('alert').textContent).toMatch(/Sin conexión/);
  expect((campo() as HTMLTextAreaElement).value).toBe('Importante');
});

it('si estoy leyendo mensajes anteriores no me baja y muestra «Mensajes nuevos»', () => {
  const { rerender } = montar([msg('1', 'luis', 'Uno')]);
  const lista = screen.getByLabelText('Mensajes de la sala');
  Object.defineProperty(lista, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(lista, 'clientHeight', { configurable: true, value: 300 });
  lista.scrollTop = 0;
  fireEvent.scroll(lista);
  rerender(<Chat mensajes={[msg('1', 'luis', 'Uno'), msg('2', 'luis', 'Dos', 3)]} miUid="ana" conectado enviar={vi.fn()} />);
  const indicador = screen.getByRole('button', { name: 'Mensajes nuevos (1)' });
  lista.scrollTo = vi.fn();
  fireEvent.click(indicador);
  expect(lista.scrollTo).toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /Mensajes nuevos/ })).toBeNull();
});

it('lista a los conectados con el anfitrión primero y marca «(tú)»', () => {
  render(
    <Participantes
      miUid="ana"
      anfitrionUid="luis"
      presentes={[{ uid: 'ana', username: 'ana', avatar: 'verde' }, { uid: 'luis', username: 'luis', avatar: 'azul' }]}
    />,
  );
  const items = screen.getAllByRole('listitem');
  expect(items[0].textContent).toMatch(/@luis.*Anfitrión/);
  expect(items[1].textContent).toMatch(/@ana \(tú\)/);
  expect(screen.getByText('(2 conectados)')).toBeTruthy();
});
