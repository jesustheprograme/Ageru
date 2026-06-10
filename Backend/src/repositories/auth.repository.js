import { getDbPool, sql } from '../config/database.js';

/**
 * Inserta o actualiza las credenciales del usuario.
 *
 * MERGE permite reutilizar el mismo flujo para alta inicial y cambio de contrasena.
 */
export const setPasswordHash = async (usuarioId, passwordHash) => {
  const pool = await getDbPool();
  await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('passwordHash', sql.NVarChar(sql.MAX), passwordHash)
    .query(`
      MERGE auth_credenciales AS target
      USING (SELECT @usuarioId AS usuario_id, @passwordHash AS password_hash) AS source
      ON target.usuario_id = source.usuario_id
      WHEN MATCHED THEN
        UPDATE SET password_hash = source.password_hash, estado = 'activo'
      WHEN NOT MATCHED THEN
        INSERT (usuario_id, password_hash, estado)
        VALUES (source.usuario_id, source.password_hash, 'activo');
    `);
};

/**
 * Recupera las credenciales activas o inactivas asociadas al usuario.
 */
export const findCredentialsByUserId = async (usuarioId) => {
  const pool = await getDbPool();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT id, usuario_id, password_hash, estado, created_at
    FROM auth_credenciales
    WHERE usuario_id = @usuarioId;
  `);

  return result.recordset[0] || null;
};
