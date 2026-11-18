# US-05 · Eliminar cuenta

Implementado en este repositorio: interfaz, cliente HTTP y simulación local.
El backend local de Sprint 1 no implementa todavía `DELETE /api/users/me`.
El borrado real en Firebase queda pendiente de implementar y desplegar en ese
repositorio. El mock elimina el perfil y las salas simuladas del anfitrión.

## Política confirmada por el equipo

Se eliminan las salas del usuario y sus mensajes. Para evitar datos huérfanos:

- Eliminar perfil y reserva de username, comprobando que pertenece al UID autenticado.
- Eliminar las salas creadas por el usuario y sus subcolecciones y referencias
  (incluidos mensajes de otros participantes dentro de esas salas).
- Eliminar sus mensajes en salas ajenas y retirar sus membresías e invitaciones.
- Conservar las salas ajenas y los mensajes de otras personas en ellas.
- Eliminar la cuenta de Firebase Authentication.

Las salas de US-06 y las solicitudes de creación se guardan en `rooms` y
`roomCreationRequests`, con el campo `anfitrionUid` en ambas colecciones.
La cascada real debe incluir estas colecciones y las referencias de mensajes que se definan.

## Contrato requerido

`DELETE /api/users/me`, sin cuerpo, con `Authorization: Bearer <ID token>`.
Identificar al usuario exclusivamente por el token verificado y permitir DELETE
en CORS. Responder **204 sin cuerpo únicamente cuando finalice todo el borrado**.
No responder 202 ni confirmar únicamente el borrado del perfil.

El frontend no llama a `deleteUser`: el servidor coordina Auth y Firestore.
Después del 204 limpia la sesión local y las rutas privadas redirigen a
`/ingresar`, con «Tu cuenta se eliminó definitivamente.» y sin destino de retorno.

Un error HTTP mantiene la sesión y permite reintentar. Los fallos de red o timeout
son ambiguos: el servidor podría haber completado la eliminación sin entregar
la respuesta. La interfaz dice que no pudo confirmar el resultado, sin prometer
que la cuenta se conserva en ese caso.

## Garantías necesarias del servidor

Firestore y Firebase Auth no comparten una transacción. Una secuencia de dos
borrados sin recuperación no cumple el criterio «si falla, la cuenta se conserva».
La implementación debe definir un proceso durable con compensación o reconciliación,
bloquear escrituras concurrentes y no liberar el username antes de que sea seguro.
No devolver un fallo recuperable que prometa conservación si hubo cambios parciales.
Hacer la operación idempotente y permitir consultar/reconciliar el resultado tras
una pérdida de respuesta, sin habilitar operaciones ajenas para tokens revocados.
Recorrer subcolecciones explícitamente y procesar volúmenes mayores que un lote.

Verificar en emuladores la eliminación de perfil, reserva, Auth, salas, mensajes y
referencias; inyectar fallos en cada etapa y comprobar recuperación, carreras y
reintentos. Estas garantías no se pueden verificar con pruebas del frontend.

## Verificación del frontend

`npm test` y `npm run build`.

El modal nativo usa `showModal()` para aislar el fondo y confinar el foco. Abre con
foco en Cancelar; Cancelar o Esc cierran y restauran el foco al disparador.
Durante «Eliminando cuenta…» se bloquean el cierre y los envíos repetidos.
El botón se deshabilita durante un guardado de perfil.

Para el mock: `MOCK_ELIMINACION=error` devuelve 503 sin cambiar perfiles;
`MOCK_DELAY` controla la espera. En éxito libera el username y evita recrear el
perfil al reutilizar el mismo token. No usar este servidor en producción.
Las pruebas de JSDOM simulan la API de dialog; la navegación por Tab y el fondo
inerte deben comprobarse también en un navegador real.
