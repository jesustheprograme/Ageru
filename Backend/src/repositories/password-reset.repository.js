import { getDbPool, sql } from '../config/database.js';

/**
 * Repositorio de tokens de recuperacion.
 * Persiste hashes de token y marcas de uso para evitar reutilizacion de enlaces.
 */
export const createPasswordResetToken = async ({ usuarioId, tokenHash, expiresAt }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('tokenHash', sql.Char(64), tokenHash)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query(`
      DECLARE @tokenCreado TABLE (
        id UNIQUEIDENTIFIER,
        usuario_id UNIQUEIDENTIFIER,
        token_hash CHAR(64),
        expires_at DATETIME2,
        used_at DATETIME2,
        created_at DATETIME2
      );

      INSERT INTO password_reset_tokens (id, usuario_id, token_hash, expires_at)
      OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.token_hash,
             INSERTED.expires_at, INSERTED.used_at, INSERTED.created_at
      INTO @tokenCreado
      VALUES (NEWID(), @usuarioId, @tokenHash, @expiresAt);

      SELECT id, usuario_id, token_hash, expires_at, used_at, created_at
      FROM @tokenCreado;
    `);

  return result.recordset[0];
};

/**
 * Invalida todos los tokens pendientes de un usuario.
 */
export const markOpenPasswordResetTokensUsed = async (usuarioId) => {
  const pool = await getDbPool();
  await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    UPDATE password_reset_tokens
    SET used_at = SYSUTCDATETIME()
    WHERE usuario_id = @usuarioId
      AND used_at IS NULL;
  `);
};

/**
 * Recupera el token mas reciente que coincide con el hash recibido.
 */
export const findPasswordResetTokenByHash = async (tokenHash) => {
  const pool = await getDbPool();
  const result = await pool.request().input('tokenHash', sql.Char(64), tokenHash).query(`
    SELECT TOP 1 id, usuario_id, token_hash, expires_at, used_at, created_at
    FROM password_reset_tokens
    WHERE token_hash = @tokenHash
    ORDER BY created_at DESC;
  `);

  return result.recordset[0] || null;
};

/**
 * Marca un token especifico como usado.
 */
export const markPasswordResetTokenUsed = async (id) => {
  const pool = await getDbPool();
  await pool.request().input('id', sql.UniqueIdentifier, id).query(`
    UPDATE password_reset_tokens
    SET used_at = SYSUTCDATETIME()
    WHERE id = @id;
  `);
};
