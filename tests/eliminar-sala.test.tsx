import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Panel } from '../src/pages/Panel';
import { Sala } from '../src/pages/Sala';
import { RUTAS, rutaSala } from '../src/routes/rutas';

vi.mock('../src/features/auth/AuthContext', () => {
  const contexto = {
    estado: { status: 'autenticado', user: { uid: 'ana' }, perfil: { nombres: 'Ana', username: 'ana' } },
    obtenerToken: async () => 'token-de-prueba',
  };
  return { useAuth: () => contexto };
});
vi.mock('../src/config/app', () => ({ API_URL: 'http://api.test', APP_NAME: 'Salón de Estudio' }));

// El estado de la sala en vivo se controla desde cada prueba.
const salaEnVivo = vi.hoisted(() => ({ valor: {} as Record<string, unknown> }));
vi.mock('../src/features/tiempo-real/useSalaEnVivo', () => ({ useSalaEnVivo: () => salaEnVivo.valor }));

const base = {
  mensajes: [], presentes: [], conexion: { estado: 'conectado' },
  enviar: async () => ({ ok: true }), reintentar: () => undefined, reconectar: () => undefined,
  anteriores: { hayMas: false, cargando: false }, cargarAnteriores: async () => undefined,
};
const enSala = (rol: 'administrador' | 'invitado') => ({
  ...base, estado: { fase: 'lista', sala: { id: 'K7P2QX9M', nombre: 'Química', anfitrionUid: rol === 'administrador' ? 'ana' : 'luis', rol } },
});

const pedir = vi.fn<(url: string, opciones: RequestInit) => Promise<Response>>();

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={RUTAS.panel} element={<Panel />} />
        <Route path={RUTAS.sala} element={<Sala />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  pedir.mockReset();
  vi.stubGlobal('fetch', pedir);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('el anfitrión elimina una sala desde el panel con confirmación y desaparece de la lista', async () => {
  pedir
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: [
      { id: 'K7P2QX9M', nombre: 'Química', rol: 'administrador' },
      { id: 'B4WZ8HNT', nombre: 'Física', rol: 'administrador' },
    ] }), { status: 200 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  montar(RUTAS.panel);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar la sala Química' }));
  const modal = within(screen.getByRole('dialog', { name: /¿Eliminar la sala «Química»\?/ }));
  expect(modal.getByText(/no se puede deshacer/)).toBeTruthy();
  await act(async () => { fireEvent.click(modal.getByRole('button', { name: 'Sí, eliminar sala' })); });

  expect(pedir.mock.calls[1][0]).toBe('http://api.test/api/rooms/K7P2QX9M');
  expect(pedir.mock.calls[1][1].method).toBe('DELETE');
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Química' })).toBeNull());
  expect(screen.getByRole('heading', { name: 'Física' })).toBeTruthy();
  expect(screen.getByText('Sala eliminada')).toBeTruthy();
});

it('cancelar el modal no elimina nada', async () => {
  pedir.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'K7P2QX9M', nombre: 'Química', rol: 'administrador' }] }), { status: 200 }));
  montar(RUTAS.panel);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar la sala Química' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
  expect(pedir).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('heading', { name: 'Química' })).toBeTruthy();
});

it('si la API responde 403 lo explica y no quita la sala', async () => {
  pedir
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: 'K7P2QX9M', nombre: 'Química', rol: 'administrador' }] }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'No' } }), { status: 403 }));
  montar(RUTAS.panel);
  fireEvent.click(await screen.findByRole('button', { name: 'Eliminar la sala Química' }));
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, eliminar sala' })); });
  expect(await screen.findByText('Solo el anfitrión puede eliminar esta sala.')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Química' })).toBeTruthy();
});

it('dentro de la sala, el anfitrión ve «Editar nombre» y «Eliminar»; el invitado no', () => {
  salaEnVivo.valor = enSala('administrador');
  const { unmount } = montar(rutaSala('K7P2QX9M'));
  expect(screen.getByRole('link', { name: 'Editar nombre de Química' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Eliminar la sala Química' })).toBeTruthy();
  unmount();

  salaEnVivo.valor = enSala('invitado');
  montar(rutaSala('K7P2QX9M'));
  expect(screen.queryByRole('link', { name: /Editar nombre/ })).toBeNull();
  expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'Salir de la sala' })).toBeTruthy();
});

it('si el anfitrión elimina la sala con un invitado dentro, este vuelve al panel con un aviso', async () => {
  pedir.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
  salaEnVivo.valor = enSala('invitado');
  const { rerender } = montar(rutaSala('K7P2QX9M'));
  salaEnVivo.valor = { ...base, estado: { fase: 'eliminada' } };
  rerender(
    <MemoryRouter initialEntries={[rutaSala('K7P2QX9M')]}>
      <Routes>
        <Route path={RUTAS.panel} element={<Panel />} />
        <Route path={RUTAS.sala} element={<Sala />} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText('El anfitrión eliminó la sala «Química»')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Mis salas' })).toBeTruthy();
});
