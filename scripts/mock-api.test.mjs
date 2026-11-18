import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';

let server;
let base;
const token = (uid, email) => `mock.${Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url')}.mock`;
const ana = token('ana', 'ana@correo.com');
const luis = token('luis', 'luis@correo.com');

before(async () => {
  server = spawn(process.execPath, ['scripts/mock-api.mjs'], {
    env: { ...process.env, PORT: '0', MOCK_DELAY: '0', MOCK_PERFIL: 'auto', MOCK_GUARDADO: 'ok', MOCK_ELIMINACION: 'ok', MOCK_SALAS: 'ok' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('La API simulada no arrancó')), 10_000);
    server.once('error', (error) => { clearTimeout(timeout); reject(error); });
    server.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`La API terminó: ${code}`)); });
    server.stdout.on('data', (data) => {
      const url = data.toString().match(/http:\/\/localhost:\d+/)?.[0];
      if (url) { clearTimeout(timeout); resolve(url); }
    });
  });
});
after(() => server?.kill());

async function request(tokenValue, body) {
  const res = await fetch(`${base}/api/users/me`, {
    method: body === undefined ? 'GET' : 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('contrato de edición: autorización, persistencia y conflictos sin escrituras parciales', async () => {
  assert.equal((await request(undefined, { nombres: 'Intruso' })).status, 401);
  const inicial = (await request(ana)).body.data;
  const otro = (await request(luis)).body.data;
  const actualizado = { ...inicial, nombres: 'Mariana', apellidos: 'Gómez', username: 'mariana_g', correo: 'mariana@correo.com', avatar: '' };
  const { uid: _uid, ...datos } = actualizado;
  const guardado = await request(ana, { ...datos, username: ' MARIANA_G ', correo: 'MARIANA@CORREO.COM', uid: 'luis' });
  assert.equal(guardado.status, 200);
  assert.deepEqual(guardado.body.data, actualizado);
  assert.deepEqual((await request(ana)).body.data, actualizado);

  // Se permite conservar el propio username/correo al cambiar otro dato.
  assert.equal((await request(ana, datos)).status, 200);
  for (const username of ['ocupado', otro.username]) {
    const colision = await request(ana, { nombres: 'No guardar', username });
    assert.equal(colision.status, 409);
    assert.equal(colision.body.error.code, 'USERNAME_TAKEN');
    assert.ok(colision.body.error.fields.username);
    assert.deepEqual((await request(ana)).body.data, actualizado);
  }
  for (const correo of ['existente@correo.com', otro.correo]) {
    const colision = await request(ana, { nombres: 'No guardar', correo });
    assert.equal(colision.status, 409);
    assert.equal(colision.body.error.code, 'EMAIL_TAKEN');
    assert.ok(colision.body.error.fields.correo);
    assert.deepEqual((await request(ana)).body.data, actualizado);
  }
  const invalido = await request(ana, { nombres: '', apellidos: 'a'.repeat(61), correo: 'sin-arroba', username: 'a b' });
  assert.equal(invalido.status, 400);
  assert.deepEqual(Object.keys(invalido.body.error.fields).sort(), ['apellidos', 'correo', 'nombres', 'username']);
  assert.deepEqual((await request(ana)).body.data, actualizado);
  assert.deepEqual((await request(luis)).body.data, otro);

  const preflight = await fetch(`${base}/api/users/me`, { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /PATCH/);
});

test('eliminación: exige token, libera username, es idempotente y no recrea el perfil', async () => {
  const propio = token('eliminar', 'eliminar@correo.com');
  const otro = token('conservar', 'conservar@correo.com');
  const inicial = (await request(propio)).body.data;
  const conservado = (await request(otro)).body.data;
  const borrar = (valor) => fetch(`${base}/api/users/me`, {
    method: 'DELETE', headers: valor ? { Authorization: `Bearer ${valor}` } : {},
  });
  assert.equal((await borrar()).status, 401);
  assert.deepEqual((await request(propio)).body.data, inicial);
  assert.equal((await borrar(propio)).status, 204);
  assert.equal((await borrar(propio)).status, 204);
  assert.equal((await request(propio)).status, 401);
  assert.deepEqual((await request(otro)).body.data, conservado);
  assert.equal((await request(otro, { username: inicial.username })).status, 200);
  const preflight = await fetch(`${base}/api/users/me`, { method: 'OPTIONS' });
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /DELETE/);
});

test('salas: valida el nombre, conserva un ID por solicitud y limita el acceso a su anfitrión', async () => {
  const anfitrion = token('anfitrion', 'anfitrion@correo.com');
  const otro = token('otro-anfitrion', 'otro-anfitrion@correo.com');
  const consultar = async (usuario, ruta = '', datos) => {
    const headers = new Headers();
    if (usuario) headers.set('Authorization', `Bearer ${usuario}`);
    if (datos) headers.set('Content-Type', 'application/json');
    const res = await fetch(`${base}/api/rooms${ruta}`, {
      method: datos ? 'POST' : 'GET',
      headers,
      body: datos ? JSON.stringify(datos) : undefined,
    });
    return { status: res.status, ...await res.json() };
  };

  const solicitudId = randomUUID();
  assert.equal((await consultar(undefined)).status, 401);
  assert.equal((await consultar(undefined, '', { nombre: 'Física', solicitudId })).status, 401);
  for (const nombre of ['   ', ' AB ', 'a'.repeat(41)]) {
    const invalida = await consultar(anfitrion, '', { nombre, solicitudId });
    assert.equal(invalida.status, 400);
    assert.ok(invalida.error.fields.nombre);
  }
  assert.deepEqual((await consultar(anfitrion)).data, []);

  const datos = { nombre: ' Física ', solicitudId, anfitrionUid: 'otro-anfitrion' };
  const simultaneas = await Promise.all([consultar(anfitrion, '', datos), consultar(anfitrion, '', datos)]);
  assert.deepEqual(simultaneas.map(({ status }) => status).sort(), [200, 201]);
  const sala = simultaneas[0].data;
  assert.match(sala.id, /^[A-Z]{3}-[0-9]{2}[A-Z]$/);
  assert.equal(sala.nombre, 'Física');
  assert.equal(sala.rol, 'administrador');
  assert.deepEqual(simultaneas[1].data, sala);
  assert.equal((await consultar(anfitrion, '', { nombre: 'Química', solicitudId })).status, 409);
  assert.deepEqual((await consultar(anfitrion)).data, [sala]);
  assert.deepEqual((await consultar(anfitrion, `/${sala.id}`)).data, sala);
  assert.deepEqual((await consultar(anfitrion, `/${sala.id.toLowerCase()}`)).data, sala);
  assert.deepEqual((await consultar(otro)).data, []);
  assert.equal((await consultar(otro, `/${sala.id}`)).status, 404);

  const otra = await consultar(otro, '', datos);
  assert.equal(otra.status, 201);
  assert.match(otra.data.id, /^[A-Z]{3}-[0-9]{2}[A-Z]$/);
  assert.notEqual(otra.data.id, sala.id);
  const borrar = await fetch(`${base}/api/users/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${anfitrion}` },
  });
  assert.equal(borrar.status, 204);
  assert.equal((await consultar(anfitrion)).status, 401);
  assert.deepEqual((await consultar(otro)).data, [otra.data]);
  for (const nombre of [' ABC ', 'a'.repeat(40)]) {
    const valida = await consultar(otro, '', { nombre, solicitudId: randomUUID() });
    assert.equal(valida.status, 201);
    assert.equal(valida.data.nombre, nombre.trim());
  }
});
