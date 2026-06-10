# Flujos de Demo

## Probar Varias Cuentas

La sesion usa `sessionStorage`, por lo que cada pestana puede mantener una cuenta distinta.

1. Abrir `http://localhost:4200` en una pestana.
2. Iniciar sesion con la cuenta A.
3. Abrir otra pestana en la misma URL.
4. Iniciar sesion con la cuenta B.
5. Transferir desde A hacia B.

Resultado esperado:

- La cuenta A descuenta saldo.
- La cuenta B recibe saldo.
- Los movimientos aparecen solo en las cuentas involucradas.
- El dashboard y las notificaciones se actualizan por evento entre pestanas.

## Transferencia por Contacto

1. Ir a `/index/contactos`.
2. Registrar un contacto usando su email.
3. Ir a `/index/movimientos`.
4. Presionar `Contactos`.
5. Buscar por nombre, alias, email o telefono.
6. Seleccionar la tarjeta del contacto.
7. Ingresar monto y descripcion.
8. Confirmar transferencia.

Resultado esperado:

- El input de destino se rellena.
- Aparece modal de transaccion exitosa.
- El historial se actualiza por cuenta.

## Notificaciones

1. Completar una transferencia.
2. Presionar la campana del header.

Resultado esperado:

- El contador refleja movimientos recientes.
- El despliegue muestra tipo, descripcion, fecha y monto.
- `Ver todas` navega a `/index/notificaciones`.

## Grafico Cascada

El dashboard calcula los ultimos 7 dias desde movimientos reales:

- Entradas netas: barras verdes hacia arriba.
- Salidas netas: barras rojas hacia abajo.
- La linea `S/ 0` sirve como referencia.

Para verlo en negativo, realizar una transferencia de salida desde la cuenta activa.
