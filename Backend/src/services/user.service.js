import { findAccountByUserId } from '../repositories/account.repository.js';
import { setPasswordHash } from '../repositories/auth.repository.js';
import {
  createUser,
  findUserByDniAndEmail,
  findUserById,
  listUsers,
} from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { hashSecret } from '../utils/password.js';
import { createAutomaticUserCard } from './card.service.js';

/**
 * Convierte y valida la fecha que llega del formulario de registro.
 */
const toDateOnly = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError('La fecha de nacimiento no es valida');
  }

  return value;
};

/**
 * Registra el usuario y completa el alta operativa.
 *
 * El flujo esperado es: crear usuario, guardar credenciales, recuperar la cuenta
 * creada por base de datos y emitir una tarjeta inicial automatica.
 */
export const registerUser = async (payload) => {
  const passwordHash = await hashSecret(payload.password);
  const user = await createUser({
    dni: payload.dni,
    telefono: payload.telefono,
    nombres: payload.nombres,
    apellidos: payload.apellidos,
    email: payload.email,
    fechaNacimiento: toDateOnly(payload.fechaNacimiento),
  });

  await setPasswordHash(user.id, passwordHash);

  const account = await findAccountByUserId(user.id);

  if (!account) {
    throw new AppError('No se pudo crear la cuenta del usuario', 500);
  }

  const card = await createAutomaticUserCard({
    usuarioId: user.id,
    cuentaId: account.id,
  });

  return {
    usuario: user,
    auth: {
      usuarioId: user.id,
      estado: 'activo',
    },
    cuenta: account,
    tarjeta: card,
  };
};

export const getUsers = () => listUsers();

/**
 * Busca usuario por id y traduce ausencia a un error HTTP 404.
 */
export const getUserById = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return user;
};

/**
 * Recupera el usuario requerido para login y valida que pueda operar.
 */
export const getUserForLoginByDniAndEmail = async ({ dni, email }) => {
  const user = await findUserByDniAndEmail({ dni, email });

  if (!user) {
    throw new AppError('Credenciales invalidas', 401);
  }

  if (user.estado !== 'activo') {
    throw new AppError('Usuario inactivo o bloqueado', 403);
  }

  return user;
};
