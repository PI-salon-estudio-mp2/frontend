import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from '../src/features/auth/AuthContext';
import { RequireAuth } from '../src/features/auth/RequireAuth';
import { Perfil } from '../src/pages/Perfil';
import type { Perfil as PerfilDatos } from '../src/features/auth/contrato';

const firebase = vi.hoisted(() => {
  const user = { uid: 'estudiante-1', getIdToken: vi.fn(async () => 'token-de-prueba') };
  return { user, auth: { currentUser: user as typeof user | null }, listener: (_user: typeof user | null) => {} };
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

const original: PerfilDatos = {
  uid: 'estudiante-1', nombres: 'Ana', apellidos: 'Pérez', username: 'ana_perez',
  correo: 'ana@correo.com', avatar: 'azul',
};
let almacenado: PerfilDatos;
let guardar: ReturnType<typeof vi.fn>;

function PerfilSesion() {
  const { estado } = useAuth();
  return <output aria-label="Perfil de la sesión">{estado.status === 'autenticado' ? JSON.stringify(estado.perfil) : estado.status}</output>;
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/perfil']}>
      <AuthProvider>
        <PerfilSesion />
        <Routes>
          <Route element={<RequireAuth />}><Route path="/perfil" element={<Perfil />} /></Route>
          <Route path="/ingresar" element={<p>Iniciar sesión</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function respuesta(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
const input = (name: string) => screen.getByRole('textbox', { name: new RegExp(`^${name}`) }) as HTMLInputElement;
const cambiar = (name: string, value: string) => fireEvent.change(input(name), { target: { value } });
const enviar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

beforeEach(() => {
  almacenado = { ...original };
  firebase.auth.currentUser = firebase.user;
  guardar = vi.fn(async (options: RequestInit) => {
    almacenado = { ...almacenado, ...JSON.parse(options.body as string) };
    return respuesta({ data: almacenado });
  });
  vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => {
    if (options.method === 'PATCH') return guardar(options);
    return respuesta({ data: almacenado });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Mi perfil', () => {
  it('carga los datos guardados y muestra un avatar por defecto si está vacío', async () => {
    almacenado.avatar = '';
    montar();
    expect(screen.getByText('Cargando perfil…')).toBeTruthy();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    expect(input('Nombres').value).toBe('Ana');
    expect(input('Apellidos').value).toBe('Pérez');
    expect(input('Nombre de usuario').value).toBe('ana_perez');
    expect(input('Correo electrónico').value).toBe('ana@correo.com');
    expect(screen.getByText('Avatar por defecto')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('guarda los cinco campos con token y sincroniza el perfil de toda la sesión', async () => {
    const vista = montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', '  Mariana  ');
    cambiar('Apellidos', '  Gómez  ');
    cambiar('Nombre de usuario', '  MARIANA_G  ');
    cambiar('Correo electrónico', 'MARIANA@CORREO.COM');
    fireEvent.click(screen.getByRole('radio', { name: 'Verde' }));
    enviar();
    await screen.findByText('Perfil actualizado');
    const esperado = { nombres: 'Mariana', apellidos: 'Gómez', username: 'mariana_g', correo: 'mariana@correo.com', avatar: 'verde' };
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(JSON.parse(guardar.mock.calls[0][0].body)).toEqual(esperado);
    expect(fetch).toHaveBeenLastCalledWith('http://api.test/api/users/me', expect.objectContaining({
      method: 'PATCH', headers: expect.objectContaining({ Authorization: 'Bearer token-de-prueba' }),
    }));
    expect(JSON.parse(screen.getByLabelText('Perfil de la sesión').textContent!)).toEqual({ uid: original.uid, ...esperado });
    vista.unmount();
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    expect(input('Nombre de usuario').value).toBe('mariana_g');
  });

  it.each([
    ['USERNAME_TAKEN', 'Nombre de usuario', 'ocupado', 'username'],
    ['EMAIL_TAKEN', 'Correo electrónico', 'existente@correo.com', 'correo'],
  ])('bloquea %s y asocia el error al campo sin perder la edición', async (code, label, value, id) => {
    guardar.mockResolvedValue(respuesta({ error: { code } }, 409));
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar(label, value);
    cambiar('Nombres', 'Mariana');
    enviar();
    await waitFor(() => expect(input(label).getAttribute('aria-invalid')).toBe('true'));
    expect(input(label).getAttribute('aria-describedby')).toContain(`${id}-error`);
    expect(document.getElementById(`${id}-error`)?.textContent).toMatch(/ocupado|en uso/);
    // El error se renderiza antes de que useEffect traslade el foco al resumen.
    await waitFor(() => {
      expect(document.activeElement?.getAttribute('aria-labelledby')).toBe('resumen-errores-titulo');
    });
    expect(input('Nombres').value).toBe('Mariana');
    expect(screen.queryByText('Perfil actualizado')).toBeNull();
    expect(almacenado).toEqual(original);
  });

  it('cancelar descarta todos los cambios sin realizar peticiones de escritura', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); cambiar('Apellidos', 'Gómez');
    cambiar('Nombre de usuario', 'otra'); cambiar('Correo electrónico', 'otra@correo.com');
    fireEvent.click(screen.getByRole('radio', { name: 'Verde' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(input('Nombres').value).toBe(original.nombres);
    expect(input('Apellidos').value).toBe(original.apellidos);
    expect(input('Nombre de usuario').value).toBe(original.username);
    expect(input('Correo electrónico').value).toBe(original.correo);
    expect((screen.getByRole('radio', { name: 'Azul' }) as HTMLInputElement).checked).toBe(true);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('cancelar después de guardar o de un error restaura el último perfil guardado', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); enviar();
    await screen.findByText('Perfil actualizado');
    guardar.mockResolvedValue(respuesta({ error: { code: 'USERNAME_TAKEN' } }, 409));
    cambiar('Nombres', 'Borrador'); cambiar('Nombre de usuario', 'ocupado'); enviar();
    await waitFor(() => expect(input('Nombre de usuario').getAttribute('aria-invalid')).toBe('true'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(input('Nombres').value).toBe('Mariana');
    expect(input('Nombre de usuario').value).toBe(original.username);
    expect(input('Nombre de usuario').getAttribute('aria-invalid')).toBeNull();
  });

  it('conserva el borrador ante un fallo de red y permite reintentar', async () => {
    guardar.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); enviar();
    await screen.findByText(/No pudimos conectarnos con el servidor/);
    expect(input('Nombres').value).toBe('Mariana');
    expect(almacenado).toEqual(original);
    enviar();
    await screen.findByText('Perfil actualizado');
    expect(almacenado.nombres).toBe('Mariana');
  });

  it('valida los campos antes de enviar', async () => {
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', ''); cambiar('Apellidos', 'a'.repeat(61));
    cambiar('Nombre de usuario', 'a b'); cambiar('Correo electrónico', 'incorrecto'); enviar();
    for (const label of ['Nombres', 'Apellidos', 'Nombre de usuario', 'Correo electrónico']) {
      expect(input(label).getAttribute('aria-invalid')).toBe('true');
    }
    expect(guardar).not.toHaveBeenCalled();
  });

  it.each([
    { uid: original.uid, username: original.username },
    { ...original, uid: 'otro-estudiante' },
  ])('no confirma respuestas incompletas ni pertenecientes a otra cuenta', async (data) => {
    guardar.mockResolvedValue(respuesta({ data }));
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); enviar();
    await screen.findByText(/No pudimos confirmar el perfil actualizado/);
    expect(screen.queryByText('Perfil actualizado')).toBeNull();
    expect(input('Nombres').value).toBe('Mariana');
    expect(JSON.parse(screen.getByLabelText('Perfil de la sesión').textContent!)).toEqual(original);
  });

  it('bloquea doble envío, cambios y cancelación mientras guarda', async () => {
    let resolver!: (value: Response) => void;
    guardar.mockImplementation(() => new Promise<Response>((resolve) => { resolver = resolve; }));
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); enviar();
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    const boton = screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    expect(input('Nombres').closest('fieldset')?.disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(boton.closest('form')!);
    expect(guardar).toHaveBeenCalledTimes(1);
    await act(async () => resolver(respuesta({ data: { ...original, nombres: 'Mariana' } })));
    await screen.findByText('Perfil actualizado');
  });

  it('permite mantener la foto de Google o volver al avatar por defecto', async () => {
    almacenado.avatar = 'https://example.com/foto.jpg';
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    fireEvent.click(screen.getByRole('radio', { name: 'Verde' }));
    fireEvent.click(screen.getByRole('button', { name: 'Conservar mi foto actual' }));
    expect(document.querySelector('img')?.getAttribute('src')).toBe(almacenado.avatar);
    fireEvent.click(screen.getByRole('button', { name: 'Usar avatar por defecto' }));
    enviar();
    await screen.findByText('Perfil actualizado');
    expect(almacenado.avatar).toBe('');
  });

  it('no recupera la sesión si una escritura termina después de cerrar sesión', async () => {
    let resolver!: (value: Response) => void;
    guardar.mockImplementation(() => new Promise<Response>((resolve) => { resolver = resolve; }));
    montar();
    await screen.findByRole('heading', { name: 'Mi perfil' });
    cambiar('Nombres', 'Mariana'); enviar();
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    act(() => { firebase.auth.currentUser = null; firebase.listener(null); });
    await screen.findByText('Iniciar sesión');
    await act(async () => resolver(respuesta({ data: { ...original, nombres: 'Mariana' } })));
    expect(screen.getByLabelText('Perfil de la sesión').textContent).toBe('anonimo');
    expect(screen.queryByRole('heading', { name: 'Mi perfil' })).toBeNull();
  });
});
