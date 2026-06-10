import { getUserById, getUsers } from '../services/user.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Controladores de usuarios.
 * Exponen consultas simples y dejan validaciones de existencia al servicio.
 */
export const listUsersController = async (req, res, next) => {
  try {
    const usuarios = await getUsers();

    return successResponse(res, {
      message: 'Usuarios encontrados',
      data: { usuarios },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Devuelve un usuario por id o propaga un 404 de dominio.
 */
export const getUserController = async (req, res, next) => {
  try {
    const usuario = await getUserById(req.params.id);

    return successResponse(res, {
      message: 'Usuario encontrado',
      data: { usuario },
    });
  } catch (error) {
    return next(error);
  }
};
