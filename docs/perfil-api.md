# US-04 · Edición de Mi perfil

La pantalla `/perfil` permite editar nombres, apellidos, username, correo y avatar.
Este cambio cubre **solo el frontend y el contrato propuesto de API**. La copia local
del backend de Sprint 1 todavía no implementa `PATCH /api/users/me`. El backend debe
implementar y desplegar esa operación para que el guardado funcione con Firestore.
La API simulada permite comprobar el flujo, pero guarda en memoria y no modifica Firebase.

## Contrato requerido

```http
PATCH /api/users/me
Authorization: Bearer <ID token de Firebase>
Content-Type: application/json

{
  "nombres": "Ana",
  "apellidos": "Pérez",
  "username": "ana_perez",
  "correo": "ana@correo.com",
  "avatar": "verde"
}
```

El frontend envía los cinco campos, sin `uid`. El servidor identifica a la persona
exclusivamente mediante el token verificado. Debe permitir `PATCH` en CORS.

| Campo | Reglas |
| --- | --- |
| `nombres`, `apellidos` | Obligatorios, entre 1 y 60 caracteres después de quitar espacios en los extremos. |
| `username` | Entre 3 y 20 caracteres, letras minúsculas, números o `_`. Se normaliza con `trim().toLowerCase()`. |
| `correo` | Correo válido; se envía sin espacios en los extremos y en minúsculas. |
| `avatar` | `azul`, `verde`, `ocre`, `morado`, `turquesa`, `rosado`, o cadena vacía para avatar por defecto. También se permite conservar la URL HTTPS que ya tenía el perfil (foto de Google). |

Respuesta **200**, después de completar la escritura, con el perfil completo guardado:

```json
{
  "data": {
    "uid": "uid-del-token",
    "nombres": "Ana",
    "apellidos": "Pérez",
    "username": "ana_perez",
    "correo": "ana@correo.com",
    "avatar": "verde"
  }
}
```

No responder `204`: el frontend necesita el perfil confirmado por el servidor para
actualizar la sesión y la base de «Cancelar». Una respuesta incompleta o con otro
`uid` debe tratarse como error, nunca como éxito.

| HTTP | `error.code` | Comportamiento del frontend |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Muestra `error.fields` junto a los campos y enfoca el resumen de errores. |
| 409 | `USERNAME_TAKEN` | Muestra disponibilidad junto a `username`; conserva el borrador. |
| 409 | `EMAIL_TAKEN` | Muestra disponibilidad junto a `correo`; conserva el borrador. |
| 401 | `UNAUTHORIZED` | Informa que debe iniciar sesión nuevamente. |
| 503 | `DB_UNAVAILABLE` | Muestra error junto a las acciones y permite reintentar. |

```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "Ese correo ya tiene una cuenta. Usa otro correo.",
    "fields": { "correo": "Ese correo ya tiene una cuenta. Usa otro correo." }
  }
}
```

El frontend reconoce ambos conflictos incluso si no se incluye `fields`.
Los fallos de red y de tiempo de espera se muestran junto a los botones de guardado,
porque afectan a toda la operación; los errores de validación se asocian al campo.

## Responsabilidades del backend

- Validar todos los campos en el servidor y excluir el propio `uid` de los conflictos.
- Reservar el nuevo username y liberar el anterior junto con la actualización del
  perfil en una transacción de Firestore; una consulta previa no evita carreras.
- Comprobar la unicidad del correo en Firebase Authentication y mantenerlo coherente
  con Firestore. Las dos plataformas no comparten transacciones: definir compensación
  o reconciliación ante fallos y no confirmar un estado parcialmente actualizado.
- No modificar ningún dato del perfil cuando se responde un conflicto.
- Preservar los campos internos del usuario y no aceptar cambios de propietario.

## Verificación local

```powershell
npm.cmd test
npm.cmd run build

$env:MOCK_DELAY = '1500'
npm.cmd run mock:api
```

Configurar `VITE_API_URL=http://localhost:3000` y la configuración de Firebase en
`.env.local`; iniciar sesión con una cuenta de prueba. La API simulada solo decodifica
el token, no lo verifica; es exclusivamente para desarrollo local.

| Escenario | Prueba manual | Resultado |
| --- | --- | --- |
| Éxito | Cambiar los cinco campos y guardar. | «Guardando…», controles bloqueados, «Perfil actualizado» y encabezado actualizado. Al recargar conserva los datos mientras el mock siga activo. |
| Username ocupado | Usar `ocupado` o `admin`. | Error junto al username; no se cambia el perfil. |
| Correo ocupado | Usar `existente@correo.com`. | Error junto al correo; no se cambia el perfil. |
| Cancelar | Modificar campos y avatar, luego cancelar. | Restaura todos los datos del último guardado sin enviar una escritura. |
| Avatar vacío | Elegir «Usar avatar por defecto». | Se muestran iniciales; el campo se guarda vacío. |
| Red | Detener el mock y guardar. | Error visible, borrador conservado y posibilidad de reintentar. |
| Servidor | Arrancar el mock con `MOCK_GUARDADO=error`. | Error 503 sin alterar los datos. |

Las pruebas automatizadas cubren el formulario integrado con AuthProvider y el cliente
HTTP (red y Firebase Auth simulados), además del contrato HTTP del mock con dos usuarios.
No prueban persistencia real en Firestore ni sustituyen la integración con el backend.
