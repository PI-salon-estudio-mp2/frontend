import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Footer } from '../src/components/layout/Footer';

const sesion = vi.hoisted(() => ({ estado: { status: 'cargando' } as { status: string } }));
vi.mock('../src/features/auth/AuthContext', () => ({ useAuth: () => ({ estado: sesion.estado }) }));

const montar = () => render(<MemoryRouter><Footer /></MemoryRouter>);

describe('Pie de página', () => {
  afterEach(cleanup);

  it('no muestra enlaces de visitante mientras se verifica la sesión', () => {
    sesion.estado = { status: 'cargando' };
    montar();
    expect(screen.queryByRole('link', { name: 'Iniciar sesión' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Declaración de accesibilidad' })).toBeTruthy();
  });

  it('muestra «Iniciar sesión» y «Crear cuenta» a un visitante', () => {
    sesion.estado = { status: 'anonimo' };
    montar();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeTruthy();
  });
});
