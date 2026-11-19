import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router';
import { signInWithPopup, signOut } from 'firebase/auth';
import { AuthProvider, useAuth } from '../src/features/auth/AuthContext';
import { ElegirUsername } from '../src/pages/ElegirUsername';
import { IniciarSesion } from '../src/pages/IniciarSesion';
import { Registro } from '../src/pages/Registro';
import { RUTAS } from '../src/routes/rutas';

const firebase = vi.hoisted(() => {
  const user = { uid: 'google-1', email: 'ana@correo.com', getIdToken: vi.fn(async () => 'token-google') };
  return { user, auth: { currentUser: null as typeof user | null }, listener: (_user: typeof user | null) => {} };
});
vi.mock('../src/lib/firebase', () => ({ auth: firebase.auth }));
vi.mock('../src/config/app', () => ({ API_URL: 'http://api.test', APP_NAME: 'Salón de Estudio' }));
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class { setCustomParameters() {} },
  onAuthStateChanged: vi.fn((_auth, callback) => {
    firebase.listener = callback;
    callback(firebase.auth.currentUser);
    return () => {};
  }),
  signInWithEmailAndPassword: vi.fn(), signInWithPopup: vi.fn(), signOut: vi.fn(),
}));

function Panel() {
  const { estado, cerrarSesion } = useAuth();
  if (estado.status === 'anonimo') return <Navigate to={RUTAS.ingresar} replace />;
  return <button onClick={() => void cerrarSesion()}>Cerrar sesión</button>;
}

function montar() {
  render(
    <MemoryRouter initialEntries={[RUTAS.registro]}>
      <AuthProvider>
        <Routes>
          <Route path={RUTAS.registro} element={<Registro />} />
          <Route path={RUTAS.elegirUsername} element={<ElegirUsername />} />
          <Route path={RUTAS.ingresar} element={<IniciarSesion />} />
          <Route path={RUTAS.panel} element={<Panel />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  firebase.auth.currentUser = null;
  vi.mocked(signInWithPopup).mockImplementation(async () => {
    firebase.auth.currentUser = firebase.user;
    firebase.listener(firebase.user);
    return {} as Awaited<ReturnType<typeof signInWithPopup>>;
  });
  vi.mocked(signOut).mockReset().mockImplementation(async () => {
    firebase.auth.currentUser = null;
    firebase.listener(null);
  });
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'USER_NOT_FOUND' } }), {
    status: 404, headers: { 'Content-Type': 'application/json' },
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function iniciarRegistroGoogle() {
  montar();
  await userEvent.click(await screen.findByRole('button', { name: 'Continuar con Google' }));
  await screen.findByRole('heading', { name: 'Elige tu nombre de usuario' });
}

describe('Cancelación del registro con Google', () => {
  it('limpia la sesión temporal y vuelve al registro sin dejar un aviso de cierre', async () => {
    await iniciarRegistroGoogle();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar registro' }));
    await screen.findByRole('heading', { name: 'Crear cuenta' });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(firebase.auth.currentUser).toBeNull();
    expect(vi.mocked(fetch).mock.calls.every(([, options]) => options?.method === 'GET')).toBe(true);
    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }));
    await screen.findByRole('heading', { name: 'Iniciar sesión' });
    expect(screen.queryByText('Cerraste tu sesión.')).toBeNull();
  });

  it('bloquea envíos durante la cancelación y permite reintentar si falla', async () => {
    await iniciarRegistroGoogle();
    let rechazar!: (error: Error) => void;
    vi.mocked(signOut).mockImplementationOnce(() => new Promise<void>((_resolve, reject) => { rechazar = reject; }));
    fireEvent.change(screen.getByRole('textbox', { name: /Nombre de usuario/ }), { target: { value: 'ana_perez' } });
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar registro' }));
    expect((screen.getByRole('button', { name: 'Cancelando…' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }).closest('form')!);
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => rechazar(new Error('Fallo de Firebase')));
    await screen.findByText('No pudimos cancelar el registro. Inténtalo de nuevo.');
    expect(firebase.auth.currentUser).toBe(firebase.user);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar registro' }));
    await screen.findByRole('heading', { name: 'Crear cuenta' });
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('mantiene el aviso al cerrar la sesión de una cuenta registrada', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ data: {
      uid: 'google-1', nombres: 'Ana', apellidos: 'Pérez', username: 'ana_perez', correo: 'ana@correo.com', avatar: 'azul',
    } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    montar();
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar con Google' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(screen.getByText('Cerraste tu sesión.')).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });
});
