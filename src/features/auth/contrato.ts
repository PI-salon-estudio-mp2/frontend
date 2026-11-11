import { ApiError } from '../../lib/api';


export interface Perfil {
  uid: string;
  nombres: string;
  apellidos: string;
  username: string;
  avatar: string;
  correo: string;
}

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