import { findAccountById, findAccountByUserId, listAccounts } from '../repositories/account.repository.js';
import { AppError } from '../utils/app-error.js';

/**
 * Servicios de cuentas.
 * Encapsulan reglas de existencia para que los controladores no dependan de detalles SQL.
 */
export const getAccounts = () => listAccounts();

/**
 * Obtiene una cuenta por id o produce un error de dominio.
 */
export const getAccountById = async (id) => {
  const account = await findAccountById(id);

  if (!account) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  return account;
};

/**
 * Obtiene la cuenta principal del usuario o informa que aun no tiene una vinculada.
 */
export const getAccountByUserId = async (usuarioId) => {
  const account = await findAccountByUserId(usuarioId);

  if (!account) {
    throw new AppError('El usuario no tiene cuenta registrada', 404);
  }

  return account;
};
