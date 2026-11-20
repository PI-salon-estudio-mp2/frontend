import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CrearSala } from '../src/pages/CrearSala';
import { EditarSala } from '../src/pages/EditarSala';
import { Panel } from '../src/pages/Panel';
import { Sala } from '../src/pages/Sala';
import { RUTAS, rutaEditarSala, rutaSala } from '../src/routes/rutas';

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
        <Route path={RUTAS.editarSala} element={<EditarSala />} />
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
  const crearVacio = screen.getByRole('link', { name: 'Crear mi primera sala' });
  expect(crearVacio.getAttribute('href')).toBe(RUTAS.crearSala);
  expect(crearVacio.className).toContain('bg-primary-600'); // único botón: principal
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
  const entrar = screen.getByRole('link', { name: 'Entrar a Álgebra' });
  expect(entrar.getAttribute('href')).toBe(rutaSala(sala.id));
  // Con salas, «Entrar» es el único botón principal; «Crear sala» del encabezado es secundario.
  expect(entrar.className).toContain('bg-primary-600');
  expect(screen.getByRole('link', { name: 'Crear sala' }).className).not.toContain('bg-primary-600');
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

it('cada sala del panel ofrece «Editar nombre» y lleva a la pantalla de edición', async () => {
  pedir.mockResolvedValueOnce(respuesta([sala, { ...sala, id: 'BQB-15M', nombre: 'Biología' }]));
  montar();
  const editar = await screen.findByRole('link', { name: 'Editar nombre de Álgebra' });
  expect(editar.getAttribute('href')).toBe(rutaEditarSala(sala.id));
  expect(editar.className).not.toContain('bg-primary-600'); // «Entrar» sigue siendo el principal
  expect(screen.getByRole('link', { name: 'Editar nombre de Biología' }).getAttribute('href')).toBe(rutaEditarSala('BQB-15M'));
});

it('renombra la sala con PATCH, vuelve al panel y confirma el cambio', async () => {
  const renombrada = { ...sala, nombre: 'Álgebra lineal' };
  pedir.mockResolvedValueOnce(respuesta([sala]))
    .mockResolvedValueOnce(respuesta(sala))
    .mockResolvedValueOnce(respuesta(renombrada))
    .mockResolvedValueOnce(respuesta([renombrada]));
  montar();
  fireEvent.click(await screen.findByRole('link', { name: 'Editar nombre de Álgebra' }));
  const campo = await screen.findByRole('textbox', { name: /Nombre de la sala/ }) as HTMLInputElement;
  expect(campo.value).toBe('Álgebra');
  expect(pedir.mock.calls[1][0]).toBe(`http://api.test/api/rooms/${sala.id}`);

  fireEvent.change(campo, { target: { value: '  Álgebra   lineal ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));
  await screen.findByRole('heading', { name: 'Álgebra lineal' });
  const [url, opciones] = pedir.mock.calls[2];
  expect(url).toBe(`http://api.test/api/rooms/${sala.id}`);
  expect(opciones.method).toBe('PATCH');
  expect(opciones.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer token-de-prueba' }));
  expect(JSON.parse(String(opciones.body))).toEqual({ nombre: 'Álgebra lineal' });
  const confirmacion = within((await screen.findByText('Nombre actualizado')).closest<HTMLElement>('[role="status"]')!);
  expect(confirmacion.getByText('La sala ahora se llama «Álgebra lineal».')).toBeTruthy();
});

it('valida el nombre antes de enviarlo y no envía el mismo nombre', async () => {
  pedir.mockResolvedValueOnce(respuesta(sala));
  montar(rutaEditarSala(sala.id));
  const campo = await screen.findByRole('textbox', { name: /Nombre de la sala/ });
  const guardar = screen.getByRole('button', { name: 'Guardar nombre' });
  for (const valor of ['   ', ' AB ', 'a'.repeat(41)]) {
    fireEvent.change(campo, { target: { value: valor } });
    fireEvent.click(guardar);
    expect(screen.getByRole('link', { name: 'Escribe un nombre de entre 3 y 40 caracteres.' })).toBeTruthy();
    expect(campo.getAttribute('aria-invalid')).toBe('true');
  }
  fireEvent.change(campo, { target: { value: ' Álgebra ' } });
  fireEvent.click(guardar);
  expect(screen.getByRole('link', { name: 'Escribe un nombre distinto al actual o cancela.' })).toBeTruthy();
  expect(pedir).toHaveBeenCalledTimes(1); // solo la carga de la sala
});

it('muestra el error del servidor al renombrar y conserva lo escrito', async () => {
  const error = (code: string, status: number, fields?: Record<string, string>) =>
    new Response(JSON.stringify({ error: { code, message: 'x', fields } }), { status });
  pedir.mockResolvedValueOnce(respuesta(sala))
    .mockResolvedValueOnce(error('FORBIDDEN', 403))
    .mockResolvedValueOnce(error('VALIDATION_ERROR', 400, { nombre: 'Escribe un nombre de entre 3 y 40 caracteres.' }));
  montar(rutaEditarSala(sala.id));
  const campo = await screen.findByRole('textbox', { name: /Nombre de la sala/ }) as HTMLInputElement;
  fireEvent.change(campo, { target: { value: 'Cálculo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));
  const alerta = within((await screen.findByText('No pudimos cambiar el nombre')).closest<HTMLElement>('[role="alert"]')!);
  expect(alerta.getByText('Solo el anfitrión puede modificar o eliminar esta sala.')).toBeTruthy();
  expect(campo.value).toBe('Cálculo');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));
  await screen.findByRole('link', { name: 'Escribe un nombre de entre 3 y 40 caracteres.' });
  expect(campo.getAttribute('aria-invalid')).toBe('true');
});

it('avisa si la sala a editar no existe en el panel', async () => {
  pedir.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'ROOM_NOT_FOUND', message: 'x' } }), { status: 404 }));
  montar(rutaEditarSala('NOEXISTE'));
  await screen.findByText('La sala no existe o no está en tu panel.');
  expect(screen.getByRole('link', { name: 'Volver a Mis salas' }).getAttribute('href')).toBe(RUTAS.panel);
  expect(screen.queryByRole('textbox')).toBeNull();
});
