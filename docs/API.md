# API REST

Base local: `http://localhost:3000/api`

## Estado

### GET `/status`

Valida que la API este disponible.

## Autenticacion

### POST `/auth/register`

Registra usuario, credenciales, cuenta y tarjeta inicial.

Campos principales:

```json
{
  "dni": "12345678",
  "telefono": "+51999999999",
  "nombres": "Jose",
  "apellidos": "Perez",
  "email": "jose@example.com",
  "fechaNacimiento": "1998-05-10",
  "password": "123456"
}
```

### POST `/auth/login`

Inicia sesion con DNI, email y contrasena.

```json
{
  "dni": "12345678",
  "email": "jose@example.com",
  "password": "123456"
}
```

Respuesta principal:

```json
{
  "ok": true,
  "token": "jwt",
  "usuario": {},
  "cuenta": {}
}
```

### POST `/auth/forgot-password`

Solicita recuperacion por correo.

### POST `/auth/reset-password`

Actualiza contrasena usando token de recuperacion.

### POST `/auth/send-code`

Envia codigo SMS.

### POST `/auth/verify-code`

Verifica codigo SMS.

## Usuarios

### GET `/usuarios`

Lista usuarios.

### GET `/usuarios/:id`

Obtiene un usuario por id.

## Cuentas

### GET `/cuentas`

Lista cuentas.

### GET `/cuentas/:id`

Obtiene una cuenta por id.

### GET `/cuentas/usuario/:usuarioId`

Obtiene la cuenta principal de un usuario.

## Contactos

### GET `/contactos/usuario/:usuarioId`

Lista contactos del usuario.

### POST `/contactos`

Crea contacto frecuente.

```json
{
  "usuarioId": "uuid",
  "email": "contacto@example.com",
  "alias": "Proveedor",
  "esFavorito": true
}
```

### DELETE `/contactos/:contactoId`

Elimina contacto. El `usuarioId` se envia en el cuerpo.

## Tarjetas

### GET `/tarjetas/usuario/:usuarioId`

Lista tarjetas del usuario sin exponer CVV.

### POST `/tarjetas`

Registra tarjeta asociada a usuario y cuenta.

```json
{
  "usuarioId": "uuid",
  "cuentaId": "uuid",
  "numTarjeta": "4111111111111111",
  "fechaCaducidad": "2029-12-31",
  "cvv": "123"
}
```

## Transacciones

### GET `/transacciones/usuario/:usuarioId`

Lista movimientos de todas las cuentas del usuario. Se conserva por compatibilidad.

### GET `/transacciones/usuario/:usuarioId/cuenta/:cuentaId`

Lista movimientos de una cuenta especifica. Es el endpoint recomendado para UI.

### POST `/transacciones/confirm`

Confirma transferencia entre cuentas.

```json
{
  "usuarioId": "uuid",
  "cuentaOrigenId": "uuid",
  "codigoCuentaDestino": "****abc123 o email",
  "monto": 10.5,
  "descripcion": "Pago proveedor",
  "code": "0000"
}
```

Respuesta principal:

```json
{
  "ok": true,
  "transaccion": {},
  "cuentaOrigen": {},
  "cuentaDestino": {}
}
```

### POST `/transacciones/operacion`

Crea operacion simple sobre una cuenta: `recarga`, `retiro` o `pago_servicio`.

```json
{
  "usuarioId": "uuid",
  "cuentaId": "uuid",
  "tipo": "recarga",
  "monto": 25,
  "descripcion": "Recarga demo"
}
```

## Formato de Error

Los errores usan respuesta JSON con `ok: false`, mensaje y codigo HTTP correspondiente.
