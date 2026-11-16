import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { after, before, test } from 'node:test';

let server;
let base;
const token = (uid, email) => `mock.${Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url')}.mock`;
const ana = token('ana', 'ana@correo.com');
const luis = token('luis', 'luis@correo.com');

before(async () => {
  server = spawn(process.execPath, ['scripts/mock-api.mjs'], {
    env: { ...process.env, PORT: '0', MOCK_DELAY: '0', MOCK_PERFIL: 'auto', MOCK_GUARDADO: 'ok' },
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
