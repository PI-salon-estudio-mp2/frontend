export const AVATARES = [
  { id: 'azul', nombre: 'Azul', color: '#2a39ad' },
  { id: 'verde', nombre: 'Verde', color: '#1d7a46' },
  { id: 'ocre', nombre: 'Ocre', color: '#8a5a00' },
  { id: 'morado', nombre: 'Morado', color: '#6b2fa0' },
  { id: 'turquesa', nombre: 'Turquesa', color: '#0b6b73' },
  { id: 'rosado', nombre: 'Rosado', color: '#a3195b' },
] as const;

export type AvatarId = (typeof AVATARES)[number]['id'];

export function colorAvatar(id: string): string {
  return AVATARES.find((a) => a.id === id)?.color ?? '#4a5070';
}