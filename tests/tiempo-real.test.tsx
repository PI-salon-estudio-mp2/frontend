import { expect, it } from 'vitest';
import { errorIdSala, mezclarMensajes, normalizarIdSala } from '../src/features/tiempo-real/contrato';

const m = (id: string, creadoEn: string) => ({ id, salaId: 'K7P2QX9M', autorUid: 'a', autorUsername: 'ana', texto: id, creadoEn });

it('normaliza y valida el ID igual que el servidor', () => {
  expect(normalizarIdSala('  k7p2 qx9m ')).toBe('K7P2QX9M');
  expect(errorIdSala('')).toBeTruthy();
  expect(errorIdSala('K7P2QX9')).toMatch(/8 caracteres/);
  expect(errorIdSala('K7P2QXOM')).toMatch(/sin 0, O/);
  expect(errorIdSala('K7P2QX9M')).toBeUndefined();
});

it('une mensajes sin duplicar el propio y los deja en orden', () => {
  const actuales = [m('b', '2026-11-21T10:00:02Z'), m('a', '2026-11-21T10:00:01Z')];
  const resultado = mezclarMensajes(actuales, [m('b', '2026-11-21T10:00:02Z'), m('c', '2026-11-21T10:00:03Z')]);
  expect(resultado.map((x) => x.id)).toEqual(['a', 'b', 'c']);
});
