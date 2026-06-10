import crypto from 'node:crypto';
import { getDbPool, sql } from '../config/database.js';
import { AppError } from '../utils/app-error.js';

/**
 * Lista las transacciones asociadas a cualquier cuenta del usuario.
 */
export const listTransactionsByUserId = async (usuarioId) => {
  const pool = await getDbPool();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT
      t.id,
      t.cuenta_origen_id,
      t.cuenta_destino_id,
      t.monto_centavos,
      t.tipo,
      t.estado,
      t.descripcion,
      t.referencia_externa,
      t.created_at,
      origen.numero_cuenta_enmascarado AS cuenta_origen_codigo,
      destino.numero_cuenta_enmascarado AS cuenta_destino_codigo,
      CASE
        WHEN origen.usuario_id = @usuarioId THEN 'salida'
        WHEN destino.usuario_id = @usuarioId THEN 'entrada'
        ELSE 'neutra'
      END AS direccion
    FROM transacciones t
    LEFT JOIN cuentas origen ON origen.id = t.cuenta_origen_id
    LEFT JOIN cuentas destino ON destino.id = t.cuenta_destino_id
    WHERE origen.usuario_id = @usuarioId OR destino.usuario_id = @usuarioId
    ORDER BY t.created_at DESC;
  `);

  return result.recordset;
};

/**
 * Lista solo los movimientos asociados a una cuenta especifica del usuario.
 */
export const listTransactionsByAccountId = async ({ usuarioId, cuentaId }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('cuentaId', sql.UniqueIdentifier, cuentaId)
    .query(`
      SELECT
        t.id,
        t.cuenta_origen_id,
        t.cuenta_destino_id,
        t.monto_centavos,
        t.tipo,
        t.estado,
        t.descripcion,
        t.referencia_externa,
        t.created_at,
        origen.numero_cuenta_enmascarado AS cuenta_origen_codigo,
        destino.numero_cuenta_enmascarado AS cuenta_destino_codigo,
        CASE
          WHEN t.cuenta_origen_id = @cuentaId THEN 'salida'
          WHEN t.cuenta_destino_id = @cuentaId THEN 'entrada'
          ELSE 'neutra'
        END AS direccion
      FROM transacciones t
      LEFT JOIN cuentas origen ON origen.id = t.cuenta_origen_id
      LEFT JOIN cuentas destino ON destino.id = t.cuenta_destino_id
      INNER JOIN cuentas cuentaActual
        ON cuentaActual.id = @cuentaId
       AND cuentaActual.usuario_id = @usuarioId
      WHERE t.cuenta_origen_id = @cuentaId
         OR t.cuenta_destino_id = @cuentaId
      ORDER BY t.created_at DESC;
    `);

  return result.recordset;
};

/**
 * Busca la cuenta destino usando el codigo visible que ingresa el usuario.
 */
export const findAccountByMaskedNumber = async (identifier) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('identifier', sql.VarChar(100), identifier)
    .query(`
      SELECT TOP 1 c.id, c.usuario_id, c.numero_cuenta_enmascarado, c.saldo_centavos,
             c.limite_diario_centavos, c.estado, c.created_at, c.updated_at
      FROM cuentas c
      INNER JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.numero_cuenta_enmascarado = @identifier
         OR LOWER(u.email) = LOWER(@identifier);
    `);

  return result.recordset[0] || null;
};

/**
 * Busca la cuenta del contacto guardado por el usuario que inicia la transferencia.
 */
export const findAccountByContactId = async ({ usuarioId, contactoId }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('contactoId', sql.UniqueIdentifier, contactoId)
    .query(`
      SELECT TOP 1 cuenta.id, cuenta.usuario_id, cuenta.numero_cuenta_enmascarado,
             cuenta.saldo_centavos, cuenta.limite_diario_centavos,
             cuenta.estado, cuenta.created_at, cuenta.updated_at
      FROM contactos contacto
      INNER JOIN cuentas cuenta ON cuenta.usuario_id = contacto.contacto_usuario_id
      WHERE contacto.id = @contactoId
        AND contacto.usuario_id = @usuarioId
      ORDER BY cuenta.created_at ASC;
    `);

  return result.recordset[0] || null;
};

const getAccountForUpdate = (request, id, alias) =>
  request.input(`${alias}Id`, sql.UniqueIdentifier, id).query(`
    SELECT id, usuario_id, numero_cuenta_enmascarado, saldo_centavos,
           limite_diario_centavos, estado, created_at, updated_at
    FROM cuentas WITH (UPDLOCK, HOLDLOCK)
    WHERE id = @${alias}Id;
  `);

/**
 * Ejecuta una transferencia con actualizacion atomica de saldos y registro de movimiento.
 */
export const createCompletedTransfer = async ({
  cuentaOrigenId,
  cuentaDestinoId,
  montoCentavos,
  descripcion,
}) => {
  // Validación estricta para evitar errores 500 en SQL Server
  if (!cuentaOrigenId || !cuentaDestinoId) {
    throw new AppError('IDs de cuenta origen y destino son requeridos', 400);
  }

  const monto = Math.round(Number(montoCentavos || 0));
  
  const oId = String(cuentaOrigenId).toLowerCase();
  const dId = String(cuentaDestinoId).toLowerCase();

  // Normalización para comparación segura (evita transferencias a uno mismo)
  if (oId === dId) {
    throw new AppError('No puedes realizar transferencias a la misma cuenta', 400);
  }

  if (isNaN(monto) || monto <= 0) {
    throw new AppError('Datos de transferencia inválidos o incompletos', 400);
  }

  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  const referenciaExterna = `TRF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    // Prevención de Deadlocks: Bloquear cuentas siempre en el mismo orden determinista (por ID)
    const idsSorted = [cuentaOrigenId, cuentaDestinoId].sort();
    const accountsMap = {};

    for (const id of idsSorted) {
      if (!id) continue;
      const alias = String(id).toLowerCase() === oId ? 'origen' : 'destino';
      const result = await getAccountForUpdate(transaction.request(), id, alias);
      accountsMap[alias] = result.recordset[0] || null;
    }

    // Extraemos las cuentas del mapa de forma segura
    const cuentaOrigen = accountsMap['origen'];
    const cuentaDestino = accountsMap['destino'];

    if (!cuentaOrigen || !cuentaDestino) {
      const error = new AppError('Cuenta no encontrada', 404);
      error.code = 'ACCOUNT_NOT_FOUND';
      throw error;
    }

    if (cuentaOrigen.estado !== 'activo' || cuentaDestino.estado !== 'activo') {
      const error = new AppError('Las cuentas deben estar activas', 400);
      error.code = 'INACTIVE_ACCOUNT';
      throw error;
    }

    if (Number(cuentaOrigen.saldo_centavos) < monto) {
      const error = new AppError('Saldo insuficiente', 400);
      error.code = 'INSUFFICIENT_FUNDS';
      throw error;
    }

    await transaction
      .request()
      .input('montoCentavos', sql.BigInt, monto)
      .input('cuentaOrigenId', sql.UniqueIdentifier, cuentaOrigenId)
      .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
      .query(`
        UPDATE cuentas
        SET saldo_centavos = saldo_centavos - @montoCentavos,
            updated_at = SYSUTCDATETIME()
        WHERE id = @cuentaOrigenId;

        UPDATE cuentas
        SET saldo_centavos = saldo_centavos + @montoCentavos,
            updated_at = SYSUTCDATETIME()
        WHERE id = @cuentaDestinoId;
      `);

    const insertResult = await transaction
      .request()
      .input('cuentaOrigenId', sql.UniqueIdentifier, cuentaOrigenId)
      .input('cuentaDestinoId', sql.UniqueIdentifier, cuentaDestinoId)
      .input('montoCentavos', sql.BigInt, monto)
      .input('tipo', sql.VarChar(30), 'transferencia')
      .input('estado', sql.VarChar(30), 'completada')
      .input('descripcion', sql.NVarChar(255), descripcion || null)
      .input('referenciaExterna', sql.VarChar(80), referenciaExterna)
      .query(`
        DECLARE @transaccionCreada TABLE (
          id UNIQUEIDENTIFIER,
          cuenta_origen_id UNIQUEIDENTIFIER,
          cuenta_destino_id UNIQUEIDENTIFIER,
          monto_centavos BIGINT,
          tipo VARCHAR(30),
          estado VARCHAR(30),
          descripcion NVARCHAR(255),
          referencia_externa VARCHAR(80),
          created_at DATETIME2
        );

        INSERT INTO transacciones (
          cuenta_origen_id,
          cuenta_destino_id,
          monto_centavos,
          tipo,
          estado,
          descripcion,
          referencia_externa
        )
        OUTPUT INSERTED.id, INSERTED.cuenta_origen_id, INSERTED.cuenta_destino_id,
               INSERTED.monto_centavos, INSERTED.tipo, INSERTED.estado,
               INSERTED.descripcion, INSERTED.referencia_externa, INSERTED.created_at
        INTO @transaccionCreada
        VALUES (
          @cuentaOrigenId,
          @cuentaDestinoId,
          @montoCentavos,
          @tipo,
          @estado,
          @descripcion,
          @referenciaExterna
        );

        SELECT id, cuenta_origen_id, cuenta_destino_id, monto_centavos, tipo,
               estado, descripcion, referencia_externa, created_at
        FROM @transaccionCreada;
      `);

    await transaction.commit();

    return {
      transaccion: insertResult.recordset[0],
      cuentaOrigen: {
        ...cuentaOrigen,
        saldo_centavos: Number(cuentaOrigen.saldo_centavos) - monto,
      },
      cuentaDestino: {
        ...cuentaDestino,
        saldo_centavos: Number(cuentaDestino.saldo_centavos) + monto,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Registra una operacion directa sobre la cuenta del usuario.
 * Recarga suma saldo; retiro y pago descuentan saldo y dejan movimiento historico.
 */
export const createAccountOperation = async ({
  cuentaId,
  montoCentavos,
  tipo,
  descripcion,
}) => {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);
  const referenciaExterna = `${tipo.toUpperCase().slice(0, 3)}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const isIncome = tipo === 'recarga';
  const monto = Number(montoCentavos);

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const accountResult = await getAccountForUpdate(transaction.request(), cuentaId, 'cuenta');
    const cuenta = accountResult.recordset[0] || null;

    if (!cuenta) {
      const error = new AppError('Cuenta no encontrada', 404);
      error.code = 'ACCOUNT_NOT_FOUND';
      throw error;
    }

    if (cuenta.estado !== 'activo') {
      const error = new AppError('La cuenta debe estar activa', 400);
      error.code = 'INACTIVE_ACCOUNT';
      throw error;
    }

    if (!isIncome && Number(cuenta.saldo_centavos) < monto) {
      const error = new AppError('Saldo insuficiente', 400);
      error.code = 'INSUFFICIENT_FUNDS';
      throw error;
    }

    await transaction
      .request()
      .input('montoCentavos', sql.BigInt, monto)
      .input('cuentaId', sql.UniqueIdentifier, cuentaId)
      .query(`
        UPDATE cuentas
        SET saldo_centavos = saldo_centavos ${isIncome ? '+' : '-'} @montoCentavos,
            updated_at = SYSUTCDATETIME()
        WHERE id = @cuentaId;
      `);

    const insertResult = await transaction
      .request()
      .input('cuentaOrigenId', sql.UniqueIdentifier, isIncome ? null : cuentaId)
      .input('cuentaDestinoId', sql.UniqueIdentifier, isIncome ? cuentaId : null)
      .input('montoCentavos', sql.BigInt, monto)
      .input('tipo', sql.VarChar(30), tipo)
      .input('estado', sql.VarChar(30), 'completada')
      .input('descripcion', sql.NVarChar(255), descripcion || null)
      .input('referenciaExterna', sql.VarChar(80), referenciaExterna)
      .query(`
        DECLARE @transaccionCreada TABLE (
          id UNIQUEIDENTIFIER,
          cuenta_origen_id UNIQUEIDENTIFIER,
          cuenta_destino_id UNIQUEIDENTIFIER,
          monto_centavos BIGINT,
          tipo VARCHAR(30),
          estado VARCHAR(30),
          descripcion NVARCHAR(255),
          referencia_externa VARCHAR(80),
          created_at DATETIME2
        );

        INSERT INTO transacciones (
          cuenta_origen_id,
          cuenta_destino_id,
          monto_centavos,
          tipo,
          estado,
          descripcion,
          referencia_externa
        )
        OUTPUT INSERTED.id, INSERTED.cuenta_origen_id, INSERTED.cuenta_destino_id,
               INSERTED.monto_centavos, INSERTED.tipo, INSERTED.estado,
               INSERTED.descripcion, INSERTED.referencia_externa, INSERTED.created_at
        INTO @transaccionCreada
        VALUES (
          @cuentaOrigenId,
          @cuentaDestinoId,
          @montoCentavos,
          @tipo,
          @estado,
          @descripcion,
          @referenciaExterna
        );

        SELECT id, cuenta_origen_id, cuenta_destino_id, monto_centavos, tipo,
               estado, descripcion, referencia_externa, created_at
        FROM @transaccionCreada;
      `);

    await transaction.commit();

    return {
      transaccion: insertResult.recordset[0],
      cuenta: {
        ...cuenta,
        saldo_centavos: Number(cuenta.saldo_centavos) + (isIncome ? monto : -monto),
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
