import { getDbPool, sql } from '../config/database.js';

export const listContactsByUserId = async (usuarioId) => {
  const pool = await getDbPool();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT
      c.id,
      c.usuario_id,
      c.contacto_usuario_id,
      c.alias,
      c.es_favorito,
      c.created_at,
      u.dni,
      u.telefono,
      u.nombres,
      u.apellidos,
      u.email,
      u.estado
    FROM contactos c
    INNER JOIN usuarios u ON u.id = c.contacto_usuario_id
    WHERE c.usuario_id = @usuarioId
    ORDER BY c.es_favorito DESC, c.created_at DESC;
  `);

  return result.recordset;
};

export const findExistingContact = async ({ usuarioId, contactoUsuarioId }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('contactoUsuarioId', sql.UniqueIdentifier, contactoUsuarioId)
    .query(`
      SELECT TOP 1 id, usuario_id, contacto_usuario_id, alias, es_favorito, created_at
      FROM contactos
      WHERE usuario_id = @usuarioId AND contacto_usuario_id = @contactoUsuarioId;
    `);

  return result.recordset[0] || null;
};

export const createContact = async ({ usuarioId, contactoUsuarioId, alias, esFavorito = false }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('contactoUsuarioId', sql.UniqueIdentifier, contactoUsuarioId)
    .input('alias', sql.VarChar(80), alias || null)
    .input('esFavorito', sql.Bit, esFavorito ? 1 : 0)
    .query(`
      DECLARE @contactoCreado TABLE (
        id UNIQUEIDENTIFIER,
        usuario_id UNIQUEIDENTIFIER,
        contacto_usuario_id UNIQUEIDENTIFIER,
        alias VARCHAR(80),
        es_favorito BIT,
        created_at DATETIME2
      );

      INSERT INTO contactos (usuario_id, contacto_usuario_id, alias, es_favorito)
      OUTPUT INSERTED.id, INSERTED.usuario_id, INSERTED.contacto_usuario_id,
             INSERTED.alias, INSERTED.es_favorito, INSERTED.created_at
      INTO @contactoCreado
      VALUES (@usuarioId, @contactoUsuarioId, @alias, @esFavorito);

      SELECT id, usuario_id, contacto_usuario_id, alias, es_favorito, created_at
      FROM @contactoCreado;
    `);

  return result.recordset[0];
};

export const removeContact = async ({ usuarioId, contactoId }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('usuarioId', sql.UniqueIdentifier, usuarioId)
    .input('contactoId', sql.UniqueIdentifier, contactoId)
    .query(`
      DELETE FROM contactos
      WHERE id = @contactoId AND usuario_id = @usuarioId;

      SELECT @@ROWCOUNT AS affected;
    `);

  return Number(result.recordset[0]?.affected || 0);
};
