import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { UnirseSala } from '../src/pages/UnirseSala';
import { RUTAS } from '../src/routes/rutas';

const unirse = vi.fn();
vi.mock('../src/features/tiempo-real/TiempoRealContext', () => ({
  useTiempoReal: () => ({ unirse, conexion: { estado: 'conectado' }, reconectar: () => undefined }),
}));
vi.mock('../src/config/app', () => ({ APP_NAME: 'Salón de Estudio' }));

function SalaDestino() {
  const { id } = useParams();
  return <h1>Dentro de {id}</h1>;
}

function montar(ruta: string = RUTAS.unirseSala) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={RUTAS.unirseSala} element={<UnirseSala />} />
        <Route path={RUTAS.sala} element={<SalaDestino />} />
      </Routes>
    </MemoryRouter>,
  );
}

const campo = () => screen.getByRole('textbox', { name: /ID de la sala/ });
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Entrar a la sala' }));

afterEach(() => {
  cleanup();
  unirse.mockReset();
});

it('pide el ID si el campo está vacío y no llama al servidor', () => {
  montar();
  entrar();
  expect(screen.getAllByText('Escribe el ID de la sala.').length).toBeGreaterThan(0);
  expect(unirse).not.toHaveBeenCalled();
});

it('explica el formato si el ID está incompleto o tiene caracteres que no existen', () => {
  montar();
  fireEvent.change(campo(), { target: { value: 'K7P2' } });
  entrar();
  expect(screen.getAllByText(/El ID tiene 8 caracteres/).length).toBeGreaterThan(0);
  fireEvent.change(campo(), { target: { value: 'K7P2QX0M' } });
  entrar();
  expect(screen.getAllByText(/sin 0, O, 1, I ni L/).length).toBeGreaterThan(0);
  expect(unirse).not.toHaveBeenCalled();
});

it('recorta los espacios, pasa a mayúsculas y entra a la sala', async () => {
  unirse.mockResolvedValue({
    ok: true,
    data: { sala: { id: 'K7P2QX9M', nombre: 'Física', anfitrionUid: 'otro', rol: 'invitado' }, presentes: [], historial: [] },
  });
  montar();
  fireEvent.change(campo(), { target: { value: '  k7p2 qx9m  ' } });
  entrar();
  expect(unirse).toHaveBeenCalledWith('K7P2QX9M');
  await screen.findByRole('heading', { name: 'Dentro de K7P2QX9M' });
});

it('muestra que la sala no existe sin salir de la pantalla', async () => {
  unirse.mockResolvedValue({ ok: false, error: { code: 'ROOM_NOT_FOUND', message: 'No encontramos una sala con ese ID. Revísalo e inténtalo de nuevo.' } });
  montar();
  fireEvent.change(campo(), { target: { value: 'ZZZZZZZZ' } });
  entrar();
  await waitFor(() => expect(screen.getAllByText(/No encontramos una sala con ese ID/).length).toBeGreaterThan(0));
  expect(campo().getAttribute('aria-invalid')).toBe('true');
});

it('toma el ID de un enlace /salas/unirse?id=', () => {
  montar(`${RUTAS.unirseSala}?id=K7P2QX9M`);
  expect((campo() as HTMLInputElement).value).toBe('K7P2QX9M');
});
