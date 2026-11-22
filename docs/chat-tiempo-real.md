# Sprint 3 · Contrato del chat en tiempo real (frontend ↔ backend-realtime)

Lo que el frontend (`src/features/tiempo-real/`) espera del servidor de tiempo real para
US-08, US-10, US-11 y US-07. Toda respuesta (ack) tiene la forma
`{ ok: true, data }` o `{ ok: false, error: { code, message } }`.

## Conexión

`io(VITE_REALTIME_URL, { auth: (cb) => cb({ token: <ID token de Firebase> }) })`.
El token se pide en cada intento de conexión. Si el handshake responde `UNAUTHORIZED`, el
frontend pide un token nuevo una sola vez y reintenta; `PROFILE_INCOMPLETE` se muestra como error.

## Eventos que YA existen en producción (Sprint 2)

| Evento | Dirección | Datos | Respuesta / uso en el frontend |
|---|---|---|---|
| `room:join` | cliente → servidor | `{ roomId }` | `{ sala: { id, nombre, anfitrionUid, rol }, presentes, historial }`. Errores: `ROOM_NOT_FOUND`, `VALIDATION_ERROR` |
| `room:leave` | cliente → servidor | `{ roomId }` | Se emite al salir de la pantalla de la sala |
| `message:send` | cliente → servidor | `{ roomId, texto }` | El mensaje guardado. Errores: `NOT_IN_ROOM`, `VALIDATION_ERROR`, `ROOM_NOT_FOUND` |
| `message:new` | servidor → sala | `{ id, salaId, autorUid, autorUsername, texto, creadoEn }` | Se agrega al chat (sin duplicar el propio) |
| `presence:update` | servidor → sala | `{ salaId, presentes: [{ uid, username, avatar }] }` | Lista de participantes y anuncios «entró / salió» |

## Pendiente en el backend (BE Lead, Sprint 3)

### 1. `history:before` (US-11 · cargar mensajes anteriores)

- **Cliente → servidor:** `{ roomId, antesDe, limite }`
  - `antesDe`: fecha ISO (`creadoEn`) del mensaje más viejo que ya está en pantalla.
  - `limite`: cuántos mensajes traer (el frontend envía 50).
- **Respuesta:** `{ ok: true, data: { mensajes: Mensaje[], hayMas: boolean } }`
  - `mensajes`: los anteriores a `antesDe`, **del más viejo al más nuevo**.
  - `hayMas`: `true` si todavía hay mensajes más viejos.
- Errores: `NOT_IN_ROOM` (el socket no está en la sala), `VALIDATION_ERROR`.
- Sugerencia en Firestore: `rooms/{id}/messages` con `where('creadoEn', '<', Timestamp.fromDate(new Date(antesDe)))`,
  `orderBy('creadoEn', 'desc')`, `limit(limite + 1)`; si llegan `limite + 1` hay más. Luego se invierte el orden.
- Opcional en `room:join`: agregar `hayMasHistorial: boolean`. Si no viene, el frontend supone que hay más
  cuando el historial trae 50 mensajes.

Mientras el evento no exista, «Cargar mensajes anteriores» muestra «No pudimos cargar los mensajes anteriores».

### 2. `room:deleted` (US-07 · eliminación con participantes conectados)

- **Servidor → sala:** `{ salaId }` cuando el anfitrión elimina la sala.
- El frontend muestra «El anfitrión eliminó esta sala» y lleva a «Mis salas».
- Propuesta para dispararlo: después de `DELETE /api/rooms/:id`, el frontend del anfitrión emite
  `room:closed` `{ roomId }`. El servidor comprueba en Firestore que la sala **ya no existe**
  (así nadie puede cerrar una sala que sigue viva), emite `room:deleted` a esa sala y saca a todos
  con `io.in(roomId).socketsLeave(roomId)`. Respuesta: `{ ok: true, data: { salaId } }`.
- Además, si alguien envía un mensaje a una sala borrada, `message:send` ya responde `ROOM_NOT_FOUND`
  y el frontend muestra el mismo aviso.
