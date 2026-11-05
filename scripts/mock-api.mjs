// API SIMULADA solo para desarrollo local del frontend. Imita el contrato de
// backend-api (GET /api/base-tecnica). NO se usa en producción: en Vercel la app
// llama a la API real de Render, que lee el dato de Firestore.
//
// Uso:   npm run mock:api                     -> http://localhost:3000/api/base-tecnica
//        MOCK_MODE=error npm run mock:api      (503 DB_UNAVAILABLE, prueba el estado de error)
//        MOCK_MODE=notfound npm run mock:api   (404 NOT_FOUND, documento inexistente)
//        MOCK_DELAY=8000 npm run mock:api      (tarda 8 s, prueba "servidor activándose")
// En Windows (PowerShell):  $env:MOCK_MODE="error"; npm run mock:api
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 3000);
const MODE = process.env.MOCK_MODE ?? 'ok';
const DELAY = Number(process.env.MOCK_DELAY ?? 600);

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const path = (req.url ?? '/').split('?')[0].replace(/\/+$/, '') || '/';

  if (path === '/health') return json(res, 200, { status: 'ok' });

  if (path === '/api/base-tecnica') {
    setTimeout(() => {
      if (MODE === 'error') {
        return json(res, 503, {
          error: { code: 'DB_UNAVAILABLE', message: 'No se pudo conectar con la base de datos' },
        });
      }
      if (MODE === 'notfound') {
        return json(res, 404, { error: { code: 'NOT_FOUND', message: 'No existe el dato de la base técnica' } });
      }
      json(res, 200, { data: { mensaje: '[MOCK LOCAL] Hola desde la API simulada' } });
    }, DELAY);
    return;
  }

  json(res, 404, { error: { code: 'ROUTE_NOT_FOUND', message: `La ruta ${req.method} ${req.url} no existe` } });
}).listen(PORT, () => {
  console.log(`API simulada en http://localhost:${PORT} (modo: ${MODE}, demora: ${DELAY} ms)`);
});
