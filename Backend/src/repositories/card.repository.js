import { getDbPool, sql } from '../config/database.js';

/**
 * Repositorio de tarjetas.
 * Guarda solo datos necesarios para mostrar la tarjeta y validar su ciclo de vida.
 */
export const createCard = async ({ usuarioId, cuentaId, numTarjeta, fechaCaducidad, cvvHash, estado = 'activo' }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('cuentaId', sql.UniqueIdentifier, cuentaId)
    .input('numTarjeta', sql.VarChar(20), numTarjeta)
    .input('fechaCaducidad', sql.Date, fechaCaducidad)
    .input('cvvHash', sql.NVarChar(sql.MAX), cvvHash)
    .input('estado', sql.VarChar(10), estado)
    .query(`
      DECLARE @tarjetaCreada TABLE (
        id UNIQUEIDENTIFIER,
        usuario_id UNIQUEIDENTIFIER,
        cuenta_id UNIQUEIDENTIFIER,
        num_tarjeta VARCHAR(20),
        fecha_caducidad DATE,
        estado VARCHAR(10)
      );

      INSERT INTO tarjeta_usuarios (id, usuario_id, cuenta_id, num_tarjeta, fecha_caducidad, cvv_hash, estado)
      OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.cuenta_id, INSERTED.num_tarjeta,
             INSERTED.fecha_caducidad, INSERTED.estado
      INTO @tarjetaCreada
      VALUES (NEWID(), @usuarioId, @cuentaId, @numTarjeta, @fechaCaducidad, @cvvHash, @estado);

      SELECT id, usuario_id, cuenta_id, num_tarjeta, fecha_caducidad, estado
      FROM @tarjetaCreada;
    `);

  return result.recordset[0];
};

/**
 * Lista tarjetas pertenecientes a un usuario.
 */
export const listCardsByUserId = async (usuarioId) => {
  const pool = await getDbPool();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT id, usuario_id, cuenta_id, num_tarjeta, fecha_caducidad, estado
    FROM tarjeta_usuarios
    WHERE usuario_id = @usuarioId
    ORDER BY fecha_caducidad DESC;
  `);

  return result.recordset;
};
