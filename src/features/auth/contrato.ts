import { ApiError } from '../../lib/api';


export interface Perfil {
  uid: string;
  nombres: string;
  apellidos: string;
  username: string;
  avatar: string;
  correo: string;
}

export type DatosPerfil = Omit<Perfil, 'uid'>;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

export function parsePerfil(json: unknown): Perfil {
  const cuerpo = esObjeto(json) && esObjeto(json.data) ? json.data : json;
  if (!esObjeto(cuerpo) || typeof cuerpo.username !== 'string' || cuerpo.username === '') {
    throw new ApiError('format', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    uid: texto(cuerpo.uid),
    nombres: texto(cuerpo.nombres),
    apellidos: texto(cuerpo.apellidos),
    username: cuerpo.username,
    avatar: texto(cuerpo.avatar),
    correo: texto(cuerpo.correo),
  };
}

/** Una escritura debe confirmar todos los campos para no sustituir datos guardados por vacíos. */
export function parsePerfilActualizado(json: unknown): Perfil {
  const cuerpo = esObjeto(json) && esObjeto(json.data) ? json.data : json;
  const campos = ['uid', 'nombres', 'apellidos', 'username', 'avatar', 'correo'] as const;
  if (!esObjeto(cuerpo) || campos.some((campo) => typeof cuerpo[campo] !== 'string')
    || campos.some((campo) => campo !== 'avatar' && !(cuerpo[campo] as string).trim())) {
    throw new ApiError('format', 'No pudimos confirmar el perfil actualizado. Recarga la página para comprobar tus datos.');
  }
  return parsePerfil(cuerpo);
}
