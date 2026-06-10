# Frontend Ageru

Aplicacion Angular 21 para la demo de pagos digitales Ageru.

## Ejecucion

```bash
npm install
npm start
```

La app queda disponible en `http://localhost:4200`.

## Build

```bash
npm run build
```

## Estructura

- `src/app/core/services`: servicios HTTP y estado compartido.
- `src/app/pages/index-page`: layout autenticado, header, dashboard y notificaciones.
- `src/app/pages/transaction-page`: movimientos, transferencias y seleccion de contactos.
- `src/app/pages/contacts-page`: gestion de contactos frecuentes.
- `src/app/pages/profile-page`: perfil y validacion SMS.
- `src/app/pages/placeholder-page`: operaciones administrativas y flujos planificados.
- `src/app/pages/shared`: componentes reutilizables.

## Estado de Sesion

La demo usa `sessionStorage` para permitir multiples cuentas en distintas pestanas del mismo navegador.

Claves principales:

- `ageru_token`
- `ageru_user`
- `ageru_account`
- `ageru_avatar`

## Actualizacion entre Pestanas

`NotificationCenterService` usa `BroadcastChannel` para avisar a otras pestanas cuando se completa una transferencia. Si la pestana actual pertenece a la cuenta origen o destino, refresca sus datos sin polling.

## Pantallas Clave

- `/index`: dashboard.
- `/index/movimientos`: transferencias e historial.
- `/index/contactos`: contactos frecuentes.
- `/index/notificaciones`: lista de alertas.
- `/index/perfil`: perfil de usuario.

## Criterios de Codigo

- Reusar servicios existentes.
- Mantener logica de negocio en backend.
- Evitar duplicar lectura de sesion fuera de `SessionService`.
- Preferir componentes simples y estados explicitos.
