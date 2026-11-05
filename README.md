# Salón de Estudio · Frontend

Frontend del **Mini-proyecto 2: Salón de Estudio Colaborativo en Tiempo Real**.
React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router 7. Se publica en **Vercel**.

> El frontend **nunca** consulta Firestore directamente: todo dato pasa por la API (`backend-api` en Render).

## Requisitos

- Node.js 20.19 o superior (recomendado 22 LTS)
- npm 10+
- Docker Desktop (opcional, para `docker compose`)

## Probar en local con el backend real

Frontend y backend están en repositorios distintos. Clónalos **uno al lado del otro**:

```
proyecto/
├── frontend/      ← este repositorio
└── backend-api/   ← https://github.com/PI-salon-estudio-mp2/backend-api
```

### 1. Backend (terminal 1)

```bash
cd backend-api
npm install
cp .env.example .env            # Windows: copy .env.example .env
```

En `backend-api/.env` (pide las credenciales de Firebase al BE Lead por un canal privado):

```env
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:8080
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

```bash
npm run dev
```

Comprueba en el navegador:
- http://localhost:3000/api/base-tecnica → `{"data":{"mensaje":"..."}}`
- http://localhost:3000/docs → Swagger

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
```

En `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev                     # http://localhost:5173
```

### 3. Qué revisar

| Prueba | Cómo | Resultado esperado |
| --- | --- | --- |
| Éxito | Abrir http://localhost:5173 | Se ve el `mensaje` de Firestore |
| Cambio en Firestore | Editar `config/base-tecnica` → `mensaje` en la consola de Firebase y recargar | Se ve el texto nuevo |
| Error | Detener el backend (Ctrl + C) y recargar | «No pudimos cargar el dato» + **Reintentar** |
| Reintentar | Volver a iniciar el backend y pulsar **Reintentar** | Vuelve a cargar el dato |
| Compilación | `npm run build` y luego `npm run preview` (http://localhost:4173) | Igual que en `dev`, sin errores en consola |

> Si ves un error de **CORS** en la consola, falta tu origen (`http://localhost:5173`, `:4173` u `:8080`)
> en `CORS_ORIGINS` del backend. Reinicia el backend después de cambiarlo.

**Alternativa sin levantar el backend:** usar la API de Render poniendo
`VITE_API_URL=https://backend-api-7xa7.onrender.com` en `.env.local`. Para eso, en Render la variable
`CORS_ORIGINS` debe incluir `http://localhost:5173`.

### API simulada (solo si no tienes el backend)

```bash
npm run mock:api                       # http://localhost:3000/api/base-tecnica (mismo formato que backend-api)
MOCK_MODE=error npm run mock:api       # 503 DB_UNAVAILABLE → estado de error
MOCK_MODE=notfound npm run mock:api    # 404 NOT_FOUND → documento inexistente
MOCK_DELAY=8000 npm run mock:api       # tarda 8 s → aviso "servidor activándose"
```

En PowerShell: `$env:MOCK_MODE="error"; npm run mock:api`. El dato simulado dice `[MOCK LOCAL]` para que nunca
se confunda con el dato real.

## Ejecutar con Docker (todo el sistema)

Con la misma estructura de carpetas y el `.env` del backend listo, desde **esta carpeta** (`frontend/`):

```bash
docker compose up --build
# si la carpeta del backend se llama distinto:  BACKEND_DIR=../otro-nombre docker compose up --build
```

| Servicio    | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:8080      |
| Backend API | http://localhost:3000      |
| Swagger     | http://localhost:3000/docs |

Solo el frontend:

```bash
docker build --build-arg VITE_API_URL=http://localhost:3000 -t salon-frontend .
docker run --rm -p 8080:80 salon-frontend
```

> Las variables `VITE_*` se incrustan al **compilar**, por eso van como `--build-arg`.
> El `Dockerfile` usa `npm ci`: hay que subir `package-lock.json` al repositorio.

## Variables de entorno

| Variable             | Obligatoria | Ejemplo                               | Descripción                               |
| -------------------- | ----------- | ------------------------------------- | ----------------------------------------- |
| `VITE_API_URL`       | Sí          | `https://backend-api-7xa7.onrender.com` | URL base de la API, sin barra final       |
| `VITE_API_DATO_PATH` | No          | `/api/base-tecnica` (por defecto)     | Endpoint de la base técnica (TS-00)       |

Nunca se suben valores reales: `.env`, `.env.local`, etc. están en `.gitignore`. Solo se versiona `.env.example`.

## Despliegue en Vercel

1. **Add New → Project** e importar el repositorio de GitHub.
2. **Root Directory:** dejarlo vacío (la raíz del repositorio). Framework: **Vite** (se detecta solo).
3. **Environment Variables:** `VITE_API_URL` = `https://backend-api-7xa7.onrender.com` (Production y Preview).
4. Deploy. Cada merge a `main` vuelve a publicar.

`vercel.json` reescribe todas las rutas a `index.html`, así `/dashboard` o `/salas/abc` funcionan al recargar
y las rutas inexistentes muestran la página 404 de la aplicación.

> **Importante:** cuando Vercel te dé la URL (por ejemplo `https://frontend-xxxx.vercel.app`), el BE Lead debe
> agregarla a `CORS_ORIGINS` en Render (separada por comas, sin barra final) y redesplegar. Sin eso, la app
> publicada muestra el estado de error y la consola un error de CORS.

## Contrato con la API (TS-00)

Definido por `backend-api` (Swagger en `/docs`). Lee el documento Firestore `config/base-tecnica`.

```http
GET {VITE_API_URL}/api/base-tecnica
```

| HTTP | Cuerpo | Qué muestra el frontend |
| --- | --- | --- |
| 200 | `{ "data": { "mensaje": "Hola desde Firestore" } }` | El mensaje |
| 404 | `{ "error": { "code": "NOT_FOUND", ... } }` | «Todavía no hay un dato guardado en la base de datos.» |
| 500 | `{ "error": { "code": "INVALID_DATA", ... } }` | «El dato guardado en la base de datos no tiene el formato correcto.» |
| 503 | `{ "error": { "code": "DB_UNAVAILABLE", ... } }` | «El servidor no pudo conectarse con la base de datos…» |

El código (`503 · DB_UNAVAILABLE`) se muestra debajo del mensaje. Si el backend cambia un campo, solo se ajusta
`src/features/base-tecnica/contrato.ts`.

## Estados de la pantalla de inicio

| Estado    | Qué ve el usuario                                                                  |
| --------- | ---------------------------------------------------------------------------------- |
| Cargando  | Indicador y texto «Cargando el dato…». A los 5 s, aviso de «servidor activándose» (Render gratuito). |
| Error     | Mensaje claro según la causa (sin red, tiempo agotado, error del servidor) y botón **Reintentar**. |
| Éxito     | El dato, su fuente, la fecha de actualización y la hora de la consulta.            |

Los tres estados se anuncian al lector de pantalla con una región viva (`role="status"`).

## Mapa del sitio (rutas)

| Ruta                  | Pantalla                     | Historia            |
| --------------------- | ---------------------------- | ------------------- |
| `/`                   | Inicio + dato de la API      | TS-00               |
| `/ingresar`           | Iniciar sesión               | US-03 (Sprint 1)    |
| `/registro`           | Crear cuenta                 | US-01, US-02        |
| `/registro/username`  | Elegir username (Google)     | US-02               |
| `/dashboard`          | Mis salas (panel)            | US-06 (Sprint 2)    |
| `/perfil`             | Mi perfil                    | US-04, US-05        |
| `/salas/nueva`        | Crear sala                   | US-06               |
| `/salas/unirse`       | Unirse a una sala            | US-08 (Sprint 3)    |
| `/salas/:id`          | Sala de estudio              | US-09 a US-14       |
| `/salas/:id/editar`   | Editar sala                  | US-07               |
| `/accesibilidad`      | Declaración de accesibilidad | US-15 (Sprint 6)    |
| `*`                   | Página no encontrada (404)   | —                   |

Las rutas se definen en un solo lugar: `src/routes/rutas.ts`.

## Estructura

```
frontend/
├── public/favicon.svg
├── scripts/mock-api.mjs          # API simulada (solo local)
├── src/
│   ├── components/
│   │   ├── layout/               # Layout, Header, Footer, Logo (estructura común)
│   │   └── ui/                   # Button, Card, Alert, Spinner, Icon, PageHeader
│   ├── config/app.ts             # nombre del producto y variables de entorno
│   ├── features/base-tecnica/    # TS-00: contrato, hook y tarjeta del dato
│   ├── hooks/usePageTitle.ts     # título distinto por página
│   ├── lib/api.ts                # cliente HTTP con manejo de errores
│   ├── pages/                    # una pantalla por archivo
│   ├── routes/rutas.ts           # mapa del sitio
│   ├── App.tsx                   # tabla de rutas
│   ├── index.css                 # guía visual (tokens de Tailwind)
│   └── main.tsx
├── Dockerfile · nginx.conf · .dockerignore
├── docker-compose.yml            # levanta frontend + backend
├── vercel.json
└── .env.example
```

## Guía visual

Los colores, la tipografía (Atkinson Hyperlegible) y los radios están en el bloque `@theme` de
`src/index.css`. Todos los pares de texto cumplen contraste AA (4.5:1 o más; ver comentario en el archivo).
Si el UX Lead cambia la guía, solo se cambian esos valores.

## Accesibilidad base (TS-04)

- `lang="es"` en el documento.
- Enlace «Saltar al contenido principal» (primer Tab).
- Regiones: `header`, `nav` (con nombre), `main`, `footer`.
- Título distinto en cada página (`usePageTitle`).
- Al cambiar de ruta el foco va al `<h1>` de la página nueva.
- Foco visible de 3 px en todos los controles; menú móvil con `aria-expanded` y cierre con Esc.
- Respeta `prefers-reduced-motion`.

## Scripts

| Script              | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                    |
| `npm run build`     | Revisa tipos y compila a `dist/`          |
| `npm run typecheck` | Solo revisa tipos                         |
| `npm run preview`   | Sirve `dist/` para probar la compilación  |
| `npm run mock:api`  | API simulada para desarrollo local        |
