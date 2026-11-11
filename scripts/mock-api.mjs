// API SIMULADA solo para desarrollo local del frontend. Imita el contrato de
// backend-api. NO se usa en producción: en Vercel la app llama a la API real de Render.
//
// Uso:   npm run mock:api                       -> http://localhost:3000
//   Base técnica:  MOCK_MODE=error | notfound ; MOCK_DELAY=8000
//   Usuarios:      MOCK_PERFIL=auto   (por defecto) cualquier token válido ya tiene perfil
//                  MOCK_PERFIL=nuevo  GET /api/users/me responde 404 hasta elegir username
//                  MOCK_PERFIL=error  GET /api/users/me responde 503
//   Usernames «ocupados» para probar el conflicto: admin, ocupado
// En Windows (PowerShell):  $env:MOCK_PERFIL="nuevo"; npm run mock:api
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 3000);
const MODE = process.env.MOCK_MODE ?? 'ok';
const DELAY = Number(process.env.MOCK_DELAY ?? 600);
const PERFIL = process.env.MOCK_PERFIL ?? 'auto';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVADOS = ['admin', 'ocupado'];
const perfiles = new Map(); // uid -> perfil

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const error = (res, status, code, message, fields) =>
  json(res, status, { error: { code, message, ...(fields ? { fields } : {}) } });

const leerCuerpo = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve(null);
      }
    });
  });

const leerUsuario = (req) => {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7).split('.')[1], 'base64url').toString('utf8'));
    const uid = payload.user_id ?? payload.sub;
    return uid
      ? { uid, correo: payload.email ?? '', nombre: payload.name ?? '', foto: payload.picture ?? '' }
      : null;
  } catch {
    return null;
  }
};

const crearPerfil = (usuario, username) => {
  const [nombres = 'Estudiante', ...resto] = (usuario.nombre || 'Estudiante de Prueba').split(' ');
  return {
    uid: usuario.uid,
    nombres,
    apellidos: resto.join(' ') || 'de Prueba',
    username,
    avatar: usuario.foto || 'azul',
    correo: usuario.correo,
  };
};

const usernameDesdeCorreo = (correo) =>
  (correo.split('@')[0] || 'estudiante').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20).padEnd(3, '_');

const usernameOcupado = (username, uid) =>
  RESERVADOS.includes(username) || [...perfiles.values()].some((p) => p.username === username && p.uid !== uid);

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/health') return json(res, 200, { status: 'ok' });

  if (path === '/api/base-tecnica') {
    setTimeout(() => {
      if (MODE === 'error') return error(res, 503, 'DB_UNAVAILABLE', 'No se pudo conectar con la base de datos');
      if (MODE === 'notfound') return error(res, 404, 'NOT_FOUND', 'No existe el dato de la base técnica');
      json(res, 200, { data: { mensaje: '[MOCK LOCAL] Hola desde la API simulada' } });
    }, DELAY);
    return;
  }

  if (path === '/api/users/username-disponible' && req.method === 'GET') {
    const username = (url.searchParams.get('username') ?? '').trim().toLowerCase();
    return json(res, 200, { data: { disponible: USERNAME_REGEX.test(username) && !usernameOcupado(username, '') } });
  }

  if (path === '/api/users/me' && req.method === 'GET') {
    const usuario = leerUsuario(req);
    if (!usuario) return error(res, 401, 'UNAUTHORIZED', 'Falta iniciar sesión');
    if (PERFIL === 'error') return error(res, 503, 'DB_UNAVAILABLE', 'No se pudo conectar con la base de datos');
    let perfil = perfiles.get(usuario.uid);
    if (!perfil && PERFIL === 'auto') {
      perfil = crearPerfil(usuario, usernameDesdeCorreo(usuario.correo));
      perfiles.set(usuario.uid, perfil);
    }
    if (!perfil) return error(res, 404, 'PROFILE_INCOMPLETE', 'Falta elegir el nombre de usuario');
    return json(res, 200, { data: perfil });
  }

  if (path === '/api/users/me/username' && req.method === 'POST') {
    const usuario = leerUsuario(req);
    if (!usuario) return error(res, 401, 'UNAUTHORIZED', 'Falta iniciar sesión');
    const cuerpo = await leerCuerpo(req);
    const username = String(cuerpo?.username ?? '').trim().toLowerCase();
    if (!USERNAME_REGEX.test(username)) {
      return error(res, 400, 'VALIDATION_ERROR', 'Datos inválidos', {
        username: 'Usa entre 3 y 20 caracteres: letras minúsculas, números o guion bajo (_).',
      });
    }
    if (usernameOcupado(username, usuario.uid)) {
      return error(res, 409, 'USERNAME_TAKEN', 'Ese nombre de usuario ya está ocupado.', {
        username: 'Ese nombre de usuario ya está ocupado. Prueba con otro.',
      });
    }
    const perfil = crearPerfil(usuario, username);
    perfiles.set(usuario.uid, perfil);
    return json(res, 201, { data: perfil });
  }

  if (path === '/api/auth/registro' && req.method === 'POST') {
    const c = (await leerCuerpo(req)) ?? {};
    const username = String(c.username ?? '').trim().toLowerCase();
    const correo = String(c.correo ?? '').trim().toLowerCase();
    const fields = {};
    for (const campo of ['nombres', 'apellidos', 'avatar', 'correo', 'contrasena']) {
      if (!String(c[campo] ?? '').trim()) fields[campo] = 'Este campo es obligatorio.';
    }
    if (!USERNAME_REGEX.test(username)) {
      fields.username = 'Usa entre 3 y 20 caracteres: letras minúsculas, números o guion bajo (_).';
    }
    if (Object.keys(fields).length > 0) return error(res, 400, 'VALIDATION_ERROR', 'Datos inválidos', fields);
    if (usernameOcupado(username, '')) return error(res, 409, 'USERNAME_TAKEN', 'Ese nombre de usuario ya está ocupado. Prueba con otro.');
    if (correo === 'existente@correo.com') return error(res, 409, 'EMAIL_TAKEN', 'Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.');
    return json(res, 201, { data: { uid: `mock-${Date.now()}` } });
  }

  error(res, 404, 'ROUTE_NOT_FOUND', `La ruta ${req.method} ${req.url} no existe`);
}).listen(PORT, () => {
  console.log(`API simulada en http://localhost:${PORT} (base técnica: ${MODE}, perfiles: ${PERFIL})`);
});