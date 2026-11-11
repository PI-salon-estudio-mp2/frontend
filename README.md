# Salón de Estudio · Frontend

Frontend del **Mini-proyecto 2: Salón de Estudio Colaborativo en Tiempo Real**.
React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router 7 + Firebase Authentication. Se publica en **Vercel**.

> El frontend **nunca** consulta Firestore directamente: solo usa Firebase Authentication para iniciar sesión
> y todo dato pasa por la API (`backend-api` en Render).

## Requisitos

- Node.js 20.19 o superior (recomendado 22 LTS)
- npm 10+
- Docker Desktop (opcional, para `docker compose`)
- La configuración web de Firebase del proyecto (ver [Variables de entorno](#variables-de-entorno))

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

En `frontend/.env.local` (la configuración de Firebase está en *Configuración del proyecto → Tus apps → App web*):

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

```bash
npm run dev                     # http://localhost:5173
```

> Si cambias una variable `VITE_*`, reinicia `npm run dev`: se leen al arrancar.

### 3. Qué revisar

| Prueba | Cómo | Resultado esperado |
| --- | --- | --- |
| Base técnica | Abrir http://localhost:5173 | Se ve el `mensaje` de Firestore |
| Cambio en Firestore | Editar `config/base-tecnica` → `mensaje` y recargar | Se ve el texto nuevo |
| Error de la API | Detener el backend (Ctrl + C) y recargar | «No pudimos cargar el dato» + **Reintentar** |
| Ruta privada sin sesión | Abrir http://localhost:5173/dashboard | Redirige a `/ingresar` |
| Inicio de sesión | Entrar con un usuario existente | Llega al panel y el encabezado muestra `@usuario` |
| Cerrar sesión | Botón «Cerrar sesión» y luego «atrás» | Va a `/ingresar`; no se ven datos privados |
| Compilación | `npm run build` y luego `npm run preview` (http://localhost:4173) | Igual que en `dev`, sin errores en consola |

> Si ves un error de **CORS** en la consola, falta tu origen (`http://localhost:5173`, `:4173` u `:8080`)
> en `CORS_ORIGINS` del backend. Reinicia el backend después de cambiarlo.

**Alternativa sin levantar el backend:** usar la API de Render poniendo
`VITE_API_URL=https://backend-api-7xa7.onrender.com` en `.env.local`. Para eso, en Render la variable
`CORS_ORIGINS` debe incluir `http://localhost:5173`.

### API simulada (solo si no tienes el backend)

Imita el contrato de `backend-api` para desarrollar sin depender de él. **No se usa en producción.**

```bash
npm run mock:api                       # http://localhost:3000
```

| Variable | Valores | Efecto |
| --- | --- | --- |
| `MOCK_MODE` | `ok` (por defecto), `error`, `notfound` | Respuesta de `/api/base-tecnica` (503 o 404 para probar errores) |
| `MOCK_DELAY` | milisegundos (por ejemplo `8000`) | Demora de `/api/base-tecnica` para ver «servidor activándose» |
| `MOCK_PERFIL` | `auto` (por defecto), `nuevo`, `error` | `auto`: cualquier sesión válida ya tiene perfil · `nuevo`: `GET /api/users/me` responde 404 hasta elegir username · `error`: responde 503 |

En PowerShell: `$env:MOCK_PERFIL="nuevo"; npm run mock:api`.

Detalles de la simulada:
- Los usernames `admin` y `ocupado` siempre están ocupados (para probar el conflicto).
- El correo `existente@correo.com` siempre está registrado.
- No verifica el token de Firebase (solo lo decodifica) y **no crea usuarios en Firebase**. Para probar el
  registro completo, crea antes el usuario en *Authentication → Usuarios* y regístrate en la pantalla con ese
  mismo correo y contraseña. La unicidad real del username solo se prueba con el backend.
- El dato de la base técnica dice `[MOCK LOCAL]` para que nunca se confunda con el real.

## Ejecutar con Docker (todo el sistema)

Con la misma estructura de carpetas y el `.env` del backend listo, desde **esta carpeta** (`frontend/`):

```bash
docker compose up --build
# si la carpeta del backend se llama distinto:  BACKEND_DIR=../otro-nombre docker compose up --build
```

`docker compose` lee las variables `VITE_*` de un archivo **`.env`** en esta carpeta (no de `.env.local`).
Copia ahí los mismos valores de Firebase; si faltan, la aplicación no podrá iniciar sesión.

| Servicio    | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:8080      |
| Backend API | http://localhost:3000      |
| Swagger     | http://localhost:3000/docs |

Solo el frontend:

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:3000 \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  --build-arg VITE_FIREBASE_APP_ID=... \
  -t salon-frontend .
docker run --rm -p 8080:80 salon-frontend
```

> Las variables `VITE_*` se incrustan al **compilar**, por eso van como `--build-arg`.
> El `Dockerfile` usa `npm ci`: hay que subir `package-lock.json` al repositorio.

## Variables de entorno

| Variable                    | Obligatoria | Ejemplo                                 | Descripción                                   |
| --------------------------- | ----------- | --------------------------------------- | --------------------------------------------- |
| `VITE_API_URL`              | Sí          | `https://backend-api-7xa7.onrender.com` | URL base de la API, sin barra final           |
| `VITE_API_DATO_PATH`        | No          | `/api/base-tecnica` (por defecto)       | Endpoint de la base técnica (TS-00)           |
| `VITE_FIREBASE_API_KEY`     | Sí          | `AIza...`                               | Configuración web de Firebase                 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sí          | `mi-proyecto.firebaseapp.com`           | Configuración web de Firebase                 |
| `VITE_FIREBASE_PROJECT_ID`  | Sí          | `salon-estudio-mp2-77521`               | ID del proyecto de Firebase                   |
| `VITE_FIREBASE_APP_ID`      | Sí          | `1:123456:web:abc123`                   | ID de la app web de Firebase                  |

Los valores `VITE_FIREBASE_*` son la configuración **pública** de la app web (no son credenciales de servidor), pero
igualmente viven en variables de entorno. Las credenciales privadas (cuenta de servicio) solo existen en
`backend-api`. Nunca se suben valores reales: `.env`, `.env.local`, etc. están en `.gitignore`. Solo se versiona
`.env.example`. Si falta una variable `VITE_FIREBASE_*`, la aplicación no puede iniciar.

## Despliegue en Vercel

1. **Add New → Project** e importar el repositorio de GitHub.
2. **Root Directory:** dejarlo vacío (la raíz del repositorio). Framework: **Vite** (se detecta solo).
3. **Environment Variables** (Production y Preview): `VITE_API_URL` y las cuatro `VITE_FIREBASE_*`.
4. Deploy. Cada merge a `main` vuelve a publicar. Si cambias una variable, haz **Redeploy**.

`vercel.json` reescribe todas las rutas a `index.html`, así `/dashboard` o `/salas/abc` funcionan al recargar
y las rutas inexistentes muestran la página 404 de la aplicación.

Cuando Vercel entregue la URL (por ejemplo `https://frontend-xxxx.vercel.app`), hay que registrarla en **dos** sitios:

- **Render** (`backend-api`): agregarla a `CORS_ORIGINS`, separada por comas y sin barra final, y redesplegar.
  Sin eso, la app publicada muestra el estado de error y la consola un error de CORS.
- **Firebase** (*Authentication → Configuración → Dominios autorizados*): agregar el dominio de Vercel
  (sin `https://`). Sin eso, el inicio de sesión con Google falla en producción.

## Autenticación (Sprint 1)

El frontend usa Firebase Authentication solo para iniciar sesión (`firebase/auth`); el perfil del usuario viene de
la API (`GET /api/users/me`) con el ID token en `Authorization: Bearer`.

**Estados de la sesión** (`src/features/auth/AuthContext.tsx`):

| Estado         | Significado                                                        | Qué hace la aplicación                                  |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| `cargando`     | Verificando la sesión o cargando el perfil                         | Muestra «Verificando tu sesión…»                        |
| `anonimo`      | Sin sesión                                                         | Las rutas privadas redirigen a `/ingresar`              |
| `sin-username` | Autenticado en Firebase (Google) pero sin perfil completo          | Todo redirige a `/registro/username`                    |
| `autenticado`  | Sesión y perfil cargados                                           | Acceso a las rutas privadas                             |
| `error`        | Hay sesión pero la API no pudo devolver el perfil                  | Mensaje claro con **Reintentar** y **Cerrar sesión**    |

**Flujos**

- **Registro manual (US-01):** `POST /api/auth/registro` crea la cuenta y el perfil en el servidor; después el
  frontend inicia sesión con Firebase y entra al panel con un mensaje de bienvenida.
- **Registro con Google (US-02):** «Continuar con Google» abre el popup de Firebase. Si el usuario aún no tiene
  username (`GET /api/users/me` → 404), se le lleva a `/registro/username`, paso que no se puede saltar
  (`POST /api/users/me/username`).
- **Inicio de sesión (US-03):** con correo y contraseña o con Google. Cualquier fallo de credenciales muestra el
  mismo mensaje genérico, «Correo o contraseña incorrectos.». Tras entrar vuelve a la ruta que se intentaba abrir.
- **Cerrar sesión:** limpia la sesión y lleva a `/ingresar`; con «atrás» las rutas privadas vuelven a redirigir.
- **Rutas privadas:** protegidas por `RequireAuth` (`src/features/auth/RequireAuth.tsx`).

**Reglas de los formularios** (`src/features/auth/validaciones.ts`; deben coincidir con las del servidor)

- Nombre de usuario: 3 a 20 caracteres, letras minúsculas, números o guion bajo (`_`). Se guarda en minúsculas.
- Contraseña: mínimo 8 caracteres, con al menos una letra y un número.
- Avatar: uno de `azul`, `verde`, `ocre`, `morado`, `turquesa`, `rosado` (registro manual) o la URL de la foto de
  la cuenta de Google. Si la foto no carga, se muestra la inicial.
- La unicidad del username y del correo se valida en el servidor; el frontend muestra el error junto al campo.

## Contrato con la API

Definido por `backend-api` (Swagger en `/docs`). Si el backend cambia un campo, solo se ajustan
`src/features/base-tecnica/contrato.ts` o `src/features/auth/contrato.ts`.

### Base técnica (TS-00)

```http
GET {VITE_API_URL}/api/base-tecnica
```

| HTTP | Cuerpo | Qué muestra el frontend |
| --- | --- | --- |
| 200 | `{ "data": { "mensaje": "Hola desde Firestore" } }` | El mensaje |
| 404 | `{ "error": { "code": "NOT_FOUND", ... } }` | «Todavía no hay un dato guardado en la base de datos.» |
| 500 | `{ "error": { "code": "INVALID_DATA", ... } }` | «El dato guardado en la base de datos no tiene el formato correcto.» |
| 503 | `{ "error": { "code": "DB_UNAVAILABLE", ... } }` | «El servidor no pudo conectarse con la base de datos…» |

### Usuarios (Sprint 1)

| Endpoint | Acceso | Uso | Respuestas que maneja el frontend |
| --- | --- | --- | --- |
| `POST /api/auth/registro` | Público | Registro manual (nombres, apellidos, username, avatar, correo, contraseña) | 201 · 400 `VALIDATION_ERROR` (con `fields` por campo) · 409 `USERNAME_TAKEN` · 409 `EMAIL_TAKEN` |
| `GET /api/users/me` | Bearer | Perfil de la sesión actual | 200 `{ data: perfil }` · 404 (falta username) · 401 (sesión inválida: se cierra la sesión) |
| `POST /api/users/me/username` | Bearer | Completar el perfil de Google | 201 · 400 · 409 `USERNAME_TAKEN` |

Formato de error de toda la API: `{ "error": { "code": "...", "message": "...", "fields": { "campo": "mensaje" } } }`
(`fields` solo en errores de validación).

## Estados de las pantallas

| Estado    | Qué ve el usuario                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Cargando  | Indicador y texto («Cargando el dato…», «Verificando tu sesión…»); en los formularios, el botón cambia a «Ingresando…», «Creando tu cuenta…» o «Guardando…». En la base técnica, a los 5 s aparece el aviso «servidor activándose» (Render gratuito). |
| Vacío     | Panel sin salas: «Aún no tienes salas».                                                                |
| Error     | Mensaje claro según la causa (sin red, tiempo agotado, error del servidor) con **Reintentar**; en formularios, resumen de errores arriba y mensaje junto a cada campo, sin borrar lo escrito. |
| Éxito     | El dato de la base técnica; mensaje de bienvenida al crear la cuenta.                                  |

Los estados se anuncian al lector de pantalla con regiones vivas (`role="status"` / `role="alert"`).

## Mapa del sitio (rutas)

| Ruta                  | Pantalla                     | Acceso   | Historia / estado                   |
| --------------------- | ---------------------------- | -------- | ----------------------------------- |
| `/`                   | Inicio + dato de la API      | Pública  | TS-00 · listo                       |
| `/ingresar`           | Iniciar sesión               | Pública  | US-03 · listo                       |
| `/registro`           | Crear cuenta                 | Pública  | US-01 y US-02 · listo               |
| `/registro/username`  | Elegir username (Google)     | Pública* | US-02 · listo                       |
| `/dashboard`          | Mis salas (panel)            | Privada  | Panel mínimo (US-06 en el Sprint 2) |
| `/perfil`             | Mi perfil                    | Privada  | US-04, US-05 · Sprint 2             |
| `/salas/nueva`        | Crear sala                   | Privada  | US-06 · Sprint 2                    |
| `/salas/unirse`       | Unirse a una sala            | Privada  | US-08 · Sprint 3                    |
| `/salas/:id`          | Sala de estudio              | Privada  | US-09 a US-14 · Sprints 3 a 5       |
| `/salas/:id/editar`   | Editar sala                  | Privada  | US-07 · Sprint 3                    |
| `/accesibilidad`      | Declaración de accesibilidad | Pública  | US-15 · Sprint 6                    |
| `*`                   | Página no encontrada (404)   | Pública  | —                                   |

\* Requiere haber iniciado sesión con Google; sin sesión redirige a `/ingresar`.

Las rutas se definen en un solo lugar: `src/routes/rutas.ts`.

## Estructura

```
frontend/
├── public/favicon.svg
├── scripts/mock-api.mjs          # API simulada (solo local)
├── src/
│   ├── components/
│   │   ├── layout/               # Layout, Header, Footer, Logo (estructura común)
│   │   └── ui/                   # Button, Card, Alert, Spinner, Icon, PageHeader,
│   │                             # TextField, PasswordField, FormErrorSummary,
│   │                             # AvisoFormulario, PantallaCarga
│   ├── config/app.ts             # nombre del producto y variables de entorno
│   ├── features/
│   │   ├── auth/                 # sesión, rutas privadas, validaciones, avatares, contrato de usuarios
│   │   └── base-tecnica/         # TS-00: contrato, hook y tarjeta del dato
│   ├── hooks/usePageTitle.ts     # título distinto por página
│   ├── lib/
│   │   ├── api.ts                # cliente HTTP con token y manejo de errores
│   │   └── firebase.ts           # Firebase Authentication (solo auth)
│   ├── pages/                    # una pantalla por archivo
│   ├── routes/rutas.ts           # mapa del sitio y navegación
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
Los colores de los avatares también tienen contraste suficiente con el texto blanco. El rojo se usa solo para
errores y acciones peligrosas. Si el UX Lead cambia la guía, solo se cambian esos valores.

## Accesibilidad (TS-04 y formularios del Sprint 1)

- `lang="es"` en el documento.
- Enlace «Saltar al contenido principal» (primer Tab).
- Regiones: `header`, `nav` (con nombre), `main`, `footer`.
- Título distinto en cada página (`usePageTitle`).
- Al cambiar de ruta el foco va al `<h1>` de la página nueva.
- Foco visible de 3 px en todos los controles; menú móvil con `aria-expanded` y cierre con Esc.
- Respeta `prefers-reduced-motion`.
- Formularios: cada campo tiene su etiqueta visible; los obligatorios lo dicen con texto; las ayudas y los errores
  están asociados al campo (`aria-describedby`, `aria-invalid`); al enviar con errores el foco va a un resumen con
  enlaces a cada campo; los errores generales se anuncian en una región `role="alert"`.
- Contraseña: permite pegar y usar el gestor de contraseñas (`autocomplete` correcto) y tiene botón «Mostrar
  contraseña» (`aria-pressed`). La autenticación no exige pruebas cognitivas (WCAG 3.3.8).
- El selector de avatar es un grupo de opciones (`fieldset` + botones de opción) que se maneja con flechas.
- Los botones muestran «cargando» con `aria-disabled` (no pierden el foco) y el avance se anuncia con `role="status"`.

## Scripts

| Script              | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                    |
| `npm run build`     | Revisa tipos y compila a `dist/`          |
| `npm run typecheck` | Solo revisa tipos                         |
| `npm run preview`   | Sirve `dist/` para probar la compilación  |
| `npm run mock:api`  | API simulada para desarrollo local        |