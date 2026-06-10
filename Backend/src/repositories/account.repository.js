import { getDbPool, sql } from '../config/database.js';

/**
 * Repositorio de cuentas.
 * Contiene solo consultas SQL; las reglas de negocio viven en account.service.js.
 */
export const findAccountByUserId = async (usuarioId) => {
  const pool = await getDbPool();
  const result = await pool.request().input('usuarioId', sql.UniqueIdentifier, usuarioId).query(`
    SELECT TOP 1 id, usuario_id, numero_cuenta_enmascarado, saldo_centavos,
           limite_diario_centavos, estado, created_at, updated_at
    FROM cuentas
    WHERE usuario_id = @usuarioId
    ORDER BY created_at ASC;
  `);

  return result.recordset[0] || null;
};

/**
 * Busca una cuenta por id.
 */
export const findAccountById = async (id) => {
  const pool = await getDbPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
    SELECT id, usuario_id, numero_cuenta_enmascarado, saldo_centavos,
           limite_diario_centavos, estado, created_at, updated_at
    FROM cuentas
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
};

/**
 * Lista cuentas ordenadas desde la mas reciente.
 */
export const listAccounts = async () => {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT id, usuario_id, numero_cuenta_enmascarado, saldo_centavos,
           limite_diario_centavos, estado, created_at, updated_at
    FROM cuentas
    ORDER BY created_at DESC;
  `);

  return result.recordset;
};
