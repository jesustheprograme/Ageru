import { getAccountById, getAccountByUserId, getAccounts } from '../services/account.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Controladores de cuentas bancarias.
 * Mantienen el contrato HTTP y delegan busquedas/errores de dominio al servicio.
 */
export const listAccountsController = async (req, res, next) => {
  try {
    const cuentas = await getAccounts();

    return successResponse(res, {
      message: 'Cuentas encontradas',
      data: { cuentas },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Devuelve una cuenta por identificador interno.
 */
export const getAccountController = async (req, res, next) => {
  try {
    const cuenta = await getAccountById(req.params.id);

    return successResponse(res, {
      message: 'Cuenta encontrada',
      data: { cuenta },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Devuelve la cuenta principal asociada a un usuario.
 */
export const getUserAccountController = async (req, res, next) => {
  try {
    const cuenta = await getAccountByUserId(req.params.usuarioId);

    return successResponse(res, {
      message: 'Cuenta del usuario encontrada',
      data: { cuenta },
    });
  } catch (error) {
    return next(error);
  }
};
