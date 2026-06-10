# Backend Ageru - Node.js + SQL Server

API REST en Node.js con Express para usuarios, credenciales, cuentas y tarjetas sobre SQL Server.

## Instalacion

```bash
cd Backend
pnpm install
```

Si partes desde cero, estas son las dependencias usadas:

```bash
pnpm add express cors dotenv twilio jsonwebtoken mssql msnodesqlv8 nodemailer
pnpm add -D nodemon
```

## Configuracion

Copia `.env.example` a `.env` y reemplaza los valores de Twilio y JWT:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=1h
FRONTEND_URL=http://localhost:4200
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password_or_app_password
MAIL_FROM="Ageru <your_email@example.com>"
DB_SERVER=(localdb)\MSSQLLocalDB
DB_NAME=Ageru
DB_AUTH=windows
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

## Ejecucion

```bash
pnpm dev
```

La API queda disponible en `http://localhost:3000`.

Antes de usar recuperacion de contrasena por email, ejecuta en SQL Server:

```sql
:r database/create-password-reset-tokens.sql
```

## Endpoints

### POST /api/auth/register

```json
{
  "dni": "12345678",
  "telefono": "+51987654321",
  "nombres": "Jose",
  "apellidos": "Perez",
  "email": "jose@example.com",
  "fechaNacimiento": "1998-05-10",
  "password": "123456"
}
```

Guarda en `usuarios`, actualiza `auth_credenciales.password_hash`, devuelve la `cuenta` creada por el trigger de SQL Server y crea una tarjeta activa en `tarjeta_usuarios` usando ese `cuenta.id`. El numero de tarjeta se genera automaticamente y queda enmascarado; el CVV se guarda hasheado.

### POST /api/auth/login

```json
{
  "dni": "12345678",
  "email": "jose@example.com",
  "password": "123456"
}
```

Valida que el DNI y el email pertenezcan al mismo usuario y que la contrasena coincida con el hash guardado.

### POST /api/auth/forgot-password

```json
{
  "email": "jose@example.com"
}
```

Genera un token de recuperacion por 30 minutos, guarda solo su hash en `password_reset_tokens` y envia un enlace al correo. La respuesta es generica para no revelar si el email existe.

### POST /api/auth/reset-password

```json
{
  "token": "token-del-link",
  "password": "nueva123"
}
```

Valida el token, actualiza `auth_credenciales.password_hash` y marca como usados los tokens abiertos del usuario.

### GET /api/usuarios

Lista usuarios.

### GET /api/usuarios/:id

Obtiene un usuario por id.

### GET /api/cuentas

Lista cuentas.

### GET /api/cuentas/:id

Obtiene una cuenta por id.

### GET /api/cuentas/usuario/:usuarioId

Obtiene la cuenta de un usuario.

### POST /api/tarjetas

```json
{
  "usuarioId": "uuid-usuario",
  "cuentaId": "uuid-cuenta",
  "numTarjeta": "4111111111111111",
  "fechaCaducidad": "2029-12-31",
  "cvv": "123"
}
```

Guarda en `tarjeta_usuarios`; el numero queda enmascarado como `****1111` y el CVV se guarda hasheado.

### GET /api/tarjetas/usuario/:usuarioId

Lista tarjetas de un usuario sin devolver el CVV.

### POST /api/auth/send-code

```json
{
  "phone": "+51987654321"
}
```

Respuesta:

```json
{
  "ok": true,
  "message": "Codigo enviado"
}
```

### POST /api/auth/verify-code

```json
{
  "phone": "+51987654321",
  "code": "123456"
}
```

Respuesta cuando el codigo es valido:

```json
{
  "ok": true,
  "message": "Login correcto",
  "token": "jwt"
}
```

## Archivos

- `src/config/env.js`: carga y valida variables de entorno.
- `src/config/twilio.js`: crea el cliente de Twilio Verify.
- `src/controllers`: recibe requests, valida campos y responde.
- `src/routes/auth.routes.js`: define rutas de autenticacion.
- `src/routes/user.routes.js`: rutas de usuarios.
- `src/routes/account.routes.js`: rutas de cuentas.
- `src/routes/card.routes.js`: rutas de tarjetas.
- `src/repositories`: consultas parametrizadas a SQL Server.
- `src/services/otp.service.js`: envia y valida codigos OTP con Twilio.
- `src/services/token.service.js`: genera JWT al aprobar el OTP.
- `src/middlewares/error.middleware.js`: maneja rutas no encontradas y errores generales.
- `src/utils/response.js`: centraliza respuestas JSON simples.
- `src/app.js`: configura Express, CORS, JSON y rutas.
- `src/server.js`: valida entorno y levanta el servidor.

## Ejemplo Angular

`auth.service.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface SendCodeResponse {
  ok: boolean;
  message: string;
}

interface VerifyCodeResponse {
  ok: boolean;
  message: string;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  sendCode(phone: string): Observable<SendCodeResponse> {
    return this.http.post<SendCodeResponse>(`${this.apiUrl}/send-code`, {
      phone,
    });
  }

  verifyCode(phone: string, code: string): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/verify-code`, {
      phone,
      code,
    });
  }
}
```
