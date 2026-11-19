import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CrearSala } from '../src/pages/CrearSala';
import { Panel } from '../src/pages/Panel';
import { Sala } from '../src/pages/Sala';
import { RUTAS, rutaSala } from '../src/routes/rutas';

vi.mock('../src/features/auth/AuthContext', () => {
  const contexto = {
    estado: {
      status: 'autenticado',
      user: { uid: 'ana' },
      perfil: { nombres: 'Ana', username: 'ana' },
    },
    obtenerToken: async () => 'token-de-prueba',
  };
  return { useAuth: () => contexto };
});
vi.mock('../src/config/app', () => ({ API_URL: 'http://api.test', APP_NAME: 'Salón de Estudio' }));

const sala = { id: 'AZA-04K', nombre: 'Álgebra', rol: 'administrador' };
const pedir = vi.fn<(url: string, opciones: RequestInit) => Promise<Response>>();

function respuesta(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), { status });
}

function montar(ruta: string = RUTAS.panel) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={RUTAS.panel} element={<Panel />} />
        <Route path={RUTAS.crearSala} element={<CrearSala />} />
        <Route path={RUTAS.sala} element={<Sala />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  pedir.mockReset();
  vi.stubGlobal('fetch', pedir);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('carga las salas, permite reintentar un fallo y ofrece crear una sala cuando el panel está vacío', async () => {
  pedir.mockRejectedValueOnce(new Error('Sin red')).mockResolvedValueOnce(respuesta([]));
  montar();
  expect(screen.getByText('Cargando salas…')).toBeTruthy();
  const alerta = within(screen.getByRole('alert'));
  await alerta.findByText('No pudimos cargar tus salas');
  expect(alerta.getByText(/Revisa tu conexión a internet/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByRole('heading', { name: 'Aún no tienes salas' });
  expect(screen.getByRole('link', { name: 'Crear sala' }).getAttribute('href')).toBe(RUTAS.crearSala);
  expect(pedir).toHaveBeenCalledTimes(2);
  expect(pedir).toHaveBeenLastCalledWith('http://api.test/api/rooms', expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer token-de-prueba' }),
  }));
});

it('explica cómo corregir nombres inválidos sin enviarlos a la API', () => {
  montar(RUTAS.crearSala);
  const nombre = screen.getByRole('textbox', { name: /Nombre de la sala/ });
  const enviar = screen.getByRole('button', { name: 'Crear sala' });
  for (const valor of ['   ', ' AB ', 'a'.repeat(41)]) {
    fireEvent.change(nombre, { target: { value: valor } });
    fireEvent.click(enviar);
    expect(screen.getByRole('link', { name: 'Escribe un nombre de entre 3 y 40 caracteres.' })).toBeTruthy();
    expect(nombre.getAttribute('aria-invalid')).toBe('true');
  }
  expect(pedir).not.toHaveBeenCalled();
});

it('mantiene la solicitud al reintentar y abre el interior como administrador al confirmarse', async () => {
  let terminarCreacion!: (res: Response) => void;
  pedir.mockRejectedValueOnce(new Error('Respuesta perdida'))
    .mockImplementationOnce(() => new Promise((resolve) => { terminarCreacion = resolve; }))
    .mockResolvedValueOnce(respuesta(sala))
    .mockResolvedValueOnce(respuesta([sala]));

  montar(RUTAS.crearSala);
  fireEvent.change(screen.getByRole('textbox', { name: /Nombre de la sala/ }), { target: { value: '  Álgebra  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear sala' }));
  const alerta = within(screen.getByRole('alert'));
  await alerta.findByText('No pudimos crear la sala');
  expect(alerta.getByText(/No pudimos conectarnos con el servidor/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Crear sala' }));
  const creando = screen.getByRole('button', { name: 'Creando sala…' });
  expect(creando.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(creando);
  await waitFor(() => expect(pedir).toHaveBeenCalledTimes(2));
  const [primerEnvio, segundoEnvio] = pedir.mock.calls;
  expect(primerEnvio[1].body).toBe(segundoEnvio[1].body);
  expect(JSON.parse(String(segundoEnvio[1].body))).toEqual({ nombre: sala.nombre, solicitudId: expect.any(String) });

  terminarCreacion(respuesta(sala, 201));
  await screen.findByRole('heading', { name: sala.nombre });
  const confirmacion = within(screen.getByRole('status'));
  expect(confirmacion.getByText('Sala creada')).toBeTruthy();
  expect(confirmacion.getByText('Comparte el ID para que tu grupo pueda entrar.')).toBeTruthy();
  expect(screen.getByText('Administrador')).toBeTruthy();
  expect(screen.getByText(sala.id)).toBeTruthy();
  expect(pedir.mock.calls[2][0]).toBe(`http://api.test/api/rooms/${sala.id}`);

  fireEvent.click(screen.getByRole('link', { name: 'Volver a Mis salas' }));
  await screen.findByRole('heading', { name: sala.nombre });
  expect(screen.getByText(sala.id)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Entrar a Álgebra' }).getAttribute('href')).toBe(rutaSala(sala.id));
});

it('copia el ID de la sala y confirma el resultado en una región de estado', async () => {
  const portapapeles = Object.create(navigator);
  const escribir = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Sin permiso'));
  Object.defineProperty(portapapeles, 'clipboard', { value: { writeText: escribir } });
  vi.stubGlobal('navigator', portapapeles);
  pedir.mockResolvedValueOnce(respuesta([sala]));
  montar();

  const boton = await screen.findByRole('button', { name: 'Copiar ID de Álgebra' });
  const tarjeta = screen.getByRole('listitem');
  const alerta = within(within(tarjeta).getByRole('alert'));
  fireEvent.click(boton);
  const confirmacion = within((await screen.findByText('ID copiado')).closest<HTMLElement>('[role="status"]')!);
  expect(confirmacion.getByText(`Copiaste el código ${sala.id}. Compártelo con tu grupo para invitarlos.`)).toBeTruthy();
  expect(escribir).toHaveBeenCalledWith(sala.id);
  fireEvent.click(boton);
  await alerta.findByText('No pudimos copiar el ID');
  expect(alerta.getByText('Vuelve a pulsar «Copiar ID» o selecciona el código y cópialo manualmente.')).toBeTruthy();
  expect(screen.queryByText('ID copiado')).toBeNull();
});
