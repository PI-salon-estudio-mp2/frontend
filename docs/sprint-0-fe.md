# Sprint 0 · FE Lead — guía de entrega

Criterios de la rúbrica que cubre este trabajo:

- **S0-C04 (14 %)** TS-00 · Aplicación web publicada que consume la API y muestra el dato
- **S0-C05 (8 %)** Estructura base del frontend

---

## 1. Lo que necesitas del equipo antes de publicar

| De quién | Qué | Estado |
| --- | --- | --- |
| BE Lead | URL de la API en Render | ✅ `https://backend-api-7xa7.onrender.com` |
| BE Lead | Endpoint y forma del JSON | ✅ `GET /api/base-tecnica` → `{ "data": { "mensaje" } }` (ya integrado) |
| BE Lead | `Dockerfile` del backend | ✅ existe; el repo `backend-api` va al lado de `frontend/` |
| BE Lead | Agregar la URL de Vercel a `CORS_ORIGINS` en Render | ⏳ cuando publiques en Vercel |
| BE Lead | Credenciales de Firebase para tu `backend-api/.env` local | ⏳ por canal privado, nunca en el repo |
| UX Lead | Guía visual y prototipo de inicio | ⏳ ajustar los tokens de `src/index.css` si cambian |
| Admin. de cuentas | Acceso al proyecto de Vercel | ⏳ él/ella integra a `main` y despliega |

Si el UX Lead cambia colores o tipografía, solo se tocan los valores del bloque `@theme` en `src/index.css`.

## 2. Trabajo en GitHub (con tu propia cuenta)

### Crear el repositorio (una sola vez)

1. Quien administra las cuentas de Vercel/Render crea en GitHub el repo **vacío** `frontend`
   (sin README ni .gitignore) y te agrega como colaborador (Settings → Collaborators). También agrega al docente con rol de lectura.
2. En tu computador, dentro de la carpeta del proyecto:

```bash
npm install                                   # genera package-lock.json
git init -b main
git remote add origin https://github.com/PI-salon-estudio-mp2/frontend.git
git add .gitignore
git commit -m "chore: .gitignore inicial"
git push -u origin main
```

`main` solo lleva ese primer commit; todo lo demás entra por pull request.

### Rama y commits

S0-C05 es un criterio de la rúbrica, no una historia aparte: la estructura base forma parte de TS-00.
Por eso basta **una rama** con varios commits pequeños (cada uno explica su cambio):

```bash
git checkout -b feature/TS-00-base-frontend

git add package.json package-lock.json vite.config.ts tsconfig*.json index.html public src/main.tsx src/vite-env.d.ts
git commit -m "chore: proyecto React + TS + Vite + Tailwind (TS-00)"

git add src/index.css src/components src/hooks src/routes src/pages src/App.tsx
git commit -m "feat: rutas del mapa del sitio, layout común, guía visual y página 404 (TS-00)"

git add src/config src/lib src/features
git commit -m "feat: consumir dato de la API con estados de carga, error y éxito (TS-00)"

git add Dockerfile nginx.conf .dockerignore docker-compose.yml vercel.json .env.example
git commit -m "chore: Dockerfile, docker-compose y configuración de Vercel (TS-00)"

git add docs scripts README.md
git commit -m "docs: README, guía del sprint y API simulada para desarrollo local (TS-00)"

git status          # debe decir "nothing to commit"; y NO debe aparecer ningún .env real
git push -u origin feature/TS-00-base-frontend
```

En GitHub: **Compare & pull request** → base `main` → descripción y capturas (plantilla abajo).
Quien administra el despliegue revisa y hace **Merge**; Vercel publica automáticamente desde `main`.

### Plantilla de pull request

```markdown
## TS-00 · Base técnica del frontend

**Qué hace**
- Proyecto React + TypeScript + Vite + Tailwind.
- La pantalla de inicio llama a `GET /api/base-tecnica` (API en Render) y muestra el dato que viene de Firestore.
- Estados: cargando (con aviso si Render está "despertando"), error con «Reintentar» y éxito.
- Dockerfile (Node → Nginx), docker-compose.yml que levanta frontend + backend, vercel.json, .env.example sin valores reales.

**Cómo probar**
1. Abrir <URL de Vercel>: se ve el dato.
2. Cambiar el campo en Firestore → recargar → se ve el cambio.
3. DevTools → Network → Offline → recargar: aparece el error y «Reintentar».

**Capturas**
(éxito, error, cargando — con la URL de producción visible)

**Uso de IA**
Se usó Claude para generar la base del código; revisado y entendido por <tu nombre>.
```

## 3. Publicar en Vercel

1. Vercel → **Add New → Project** → importar el repositorio.
2. **Root Directory:** vacío (raíz del repo) · Framework: **Vite**.
3. **Environment Variables:** `VITE_API_URL` = `https://backend-api-7xa7.onrender.com` (sin barra final).
4. Pásale al BE Lead la URL que te da Vercel para que la agregue a `CORS_ORIGINS` en Render.
5. **Deploy**. Si cambias una variable, haz **Redeploy** (las `VITE_*` se leen al compilar).

## 4. Verificación antes de la hora de corte (en la URL de producción)

**S0-C04**

- [ ] Abre la URL de Vercel y se ve el dato real (no el `[MOCK LOCAL]`).
- [ ] Cambias el dato en Firestore, recargas y se ve el nuevo valor.
- [ ] Estado **cargando**: DevTools → Network → «Slow 4G» y recargar.
- [ ] Estado **error**: DevTools → Network → «Offline» y recargar → aparece «Reintentar»; vuelves a «No throttling», pulsas «Reintentar» y carga.
- [ ] Consola **sin errores** en el estado normal (pestaña Console, nivel «Errors»).
- [ ] `docker compose up --build` levanta frontend y backend.
- [ ] `.env.example` sin valores reales; ningún `.env` en el repo.
- [ ] README del frontend actualizado.

**S0-C05**

- [ ] Todas las rutas del mapa del sitio abren (ver tabla del README) y recargan sin 404 de Vercel.
- [ ] Encabezado, navegación y pie de página iguales en todas las pantallas.
- [ ] `/cualquier-cosa` muestra la página 404 diseñada.
- [ ] Colores, letra y botones según la guía visual del UX Lead.
- [ ] En celular (o DevTools → modo dispositivo, 390 px) el menú se abre y no hay scroll horizontal.

**Apoyo a TS-04 (accesibilidad base, lo verifica QA)**

- [ ] Primer Tab muestra «Saltar al contenido principal».
- [ ] Cada página tiene un título distinto en la pestaña del navegador.
- [ ] Lighthouse → Accesibilidad ≥ 90 en la pantalla de inicio publicada.

## 5. Evidencias para el DUE

**S0-C04 — enlace de Vercel + video corto (sin cortes, URL visible):**

1. Mostrar la URL de Vercel en la barra del navegador y el dato en pantalla.
2. Abrir Firebase Console → Firestore → editar el documento del dato.
3. Volver a la app, recargar y mostrar el dato nuevo.
4. Abrir DevTools → Console: sin errores.
5. (Recomendado) Network → Offline → recargar → estado de error → Online → «Reintentar».

**S0-C05 — enlace + capturas de la navegación:**

- Inicio, una pantalla interna (por ejemplo `/dashboard`), la 404 y la vista móvil con el menú abierto,
  todas con la URL de producción visible.
