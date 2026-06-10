import { getDbPool, sql } from '../config/database.js';

/**
 * Repositorio de usuarios.
 *
 * Todas las consultas usan parametros de mssql para evitar SQL injection y
 * mantener el mapeo entre nombres del frontend y columnas de SQL Server.
 */
export const createUser = async ({ dni, telefono, nombres, apellidos, email, fechaNacimiento }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('dni', sql.VarChar(15), dni)
    .input('telefono', sql.VarChar(20), telefono)
    .input('nombres', sql.VarChar(100), nombres)
    .input('apellidos', sql.VarChar(100), apellidos)
    .input('email', sql.VarChar(150), email)
    .input('fechaNacimiento', sql.Date, fechaNacimiento)
    .query(`
      DECLARE @usuarioCreado TABLE (
        id UNIQUEIDENTIFIER,
        dni VARCHAR(15),
        telefono VARCHAR(20),
        nombres VARCHAR(100),
        apellidos VARCHAR(100),
        email VARCHAR(150),
        fecha_nacimiento DATE,
        estado VARCHAR(10),
        created_at DATETIME2,
        updated_at DATETIME2
      );

      INSERT INTO usuarios (dni, telefono, nombres, apellidos, email, fecha_nacimiento)
      OUTPUT INSERTED.id, INSERTED.dni, INSERTED.telefono, INSERTED.nombres, INSERTED.apellidos,
             INSERTED.email, INSERTED.fecha_nacimiento, INSERTED.estado, INSERTED.created_at, INSERTED.updated_at
      INTO @usuarioCreado
      VALUES (@dni, @telefono, @nombres, @apellidos, @email, @fechaNacimiento);

      SELECT id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
      FROM @usuarioCreado;
    `);

  return result.recordset[0];
};

/**
 * Busca un usuario por su identificador unico.
 */
export const findUserById = async (id) => {
  const pool = await getDbPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
    SELECT id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
    FROM usuarios
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
};

/**
 * Busca el usuario que intenta iniciar sesion por DNI y email.
 */
export const findUserByDniAndEmail = async ({ dni, email }) => {
  const pool = await getDbPool();
  const result = await pool
    .request()
    .input('dni', sql.VarChar(15), dni)
    .input('email', sql.VarChar(150), email)
    .query(`
      SELECT TOP 1 id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
      FROM usuarios
      WHERE dni = @dni AND LOWER(email) = LOWER(@email);
    `);

  return result.recordset[0] || null;
};

/**
 * Busca usuarios por correo para el flujo de recuperacion de contrasena.
 */
export const findUserByEmail = async (email) => {
  const pool = await getDbPool();
  const result = await pool.request().input('email', sql.VarChar(150), email).query(`
    SELECT TOP 1 id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
    FROM usuarios
    WHERE LOWER(email) = LOWER(@email);
  `);

  return result.recordset[0] || null;
};

/**
 * Busca un usuario por telefono para sesiones iniciadas con OTP por SMS.
 */
export const findUserByPhone = async (telefono) => {
  const pool = await getDbPool();
  const result = await pool.request().input('telefono', sql.VarChar(20), telefono).query(`
    SELECT TOP 1 id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
    FROM usuarios
    WHERE telefono = @telefono;
  `);

  return result.recordset[0] || null;
};

/**
 * Lista usuarios recientes para pantallas administrativas o pruebas manuales.
 */
export const listUsers = async () => {
  const pool = await getDbPool();
  const result = await pool.request().query(`
    SELECT id, dni, telefono, nombres, apellidos, email, fecha_nacimiento, estado, created_at, updated_at
    FROM usuarios
    ORDER BY created_at DESC;
  `);

  return result.recordset;
};
