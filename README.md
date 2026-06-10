# Ageru

Ageru es una demo de pagos digitales para pequenos comercios. Permite registrar usuarios, iniciar sesion, administrar cuenta principal, contactos, tarjetas, transferencias, movimientos, notificaciones y un dashboard con resumen financiero.

## Contenido

- `Frontend/`: aplicacion Angular 21.
- `Backend/`: API REST con Node.js, Express y SQL Server.
- `Backend/database/`: scripts SQL auxiliares.
- `docs/`: documentacion tecnica del proyecto.
- `Graficos Sprint/`: materiales de analisis y entregables de sprint.

## Funciones Principales

- Autenticacion por DNI, email y contrasena.
- Sesion por pestana usando `sessionStorage`, util para demostrar varias cuentas en el mismo navegador.
- Cuenta principal con saldo, limite diario y estado.
- Transferencias entre cuentas por codigo o email.
- Contactos frecuentes seleccionables desde modal con buscador.
- Historial de movimientos por cuenta, no por usuario global.
- Notificaciones desplegables en el header.
- Actualizacion por evento entre pestanas al completar transferencias.
- Dashboard con saldo, entradas, salidas, movimientos recientes y grafico cascada.

## Ejecucion Local

Backend:

```bash
cd Backend
pnpm install
pnpm dev
```

Frontend:

```bash
cd Frontend
npm install
npm start
```

URLs locales:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Estado API: `http://localhost:3000/api/status`

## Configuracion

El backend necesita un archivo `.env` con puerto, CORS, JWT, Twilio, correo y conexion a SQL Server. Ver [Backend/README.md](Backend/README.md) para el ejemplo completo.

## Documentacion Tecnica

- [Arquitectura](docs/ARCHITECTURE.md)
- [API REST](docs/API.md)
- [Flujos de demo](docs/DEMO-FLOWS.md)

## Validacion Recomendada

```bash
cd Frontend
npm run build
```

```bash
cd Backend
node --check src/server.js
node -e "import('./src/app.js').then(() => console.log('backend imports ok'))"
```
