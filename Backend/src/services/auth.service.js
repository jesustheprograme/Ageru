import { findCredentialsByUserId } from '../repositories/auth.repository.js';
import { findAccountByUserId } from '../repositories/account.repository.js';
import { AppError } from '../utils/app-error.js';
import { verifySecret } from '../utils/password.js';
import { createAuthToken } from './token.service.js';
import { getUserForLoginByDniAndEmail } from './user.service.js';

/**
 * Orquesta el inicio de sesion con contrasena.
 *
 * Valida usuario activo, credenciales activas y hash de contrasena antes de
 * emitir un JWT y devolver la cuenta vinculada para inicializar la sesion web.
 */
export const loginWithPassword = async ({ dni, email, password }) => {
  const user = await getUserForLoginByDniAndEmail({ dni, email });
  const credentials = await findCredentialsByUserId(user.id);

  if (!credentials || credentials.estado !== 'activo') {
    throw new AppError('Credenciales invalidas', 401);
  }

  const validPassword = await verifySecret(password, credentials.password_hash);

  if (!validPassword) {
    throw new AppError('Credenciales invalidas', 401);
  }

  const account = await findAccountByUserId(user.id);
  const token = createAuthToken({
    usuarioId: user.id,
    email: user.email,
    dni: user.dni,
    phone: user.telefono,
  });

  return {
    token,
    usuario: user,
    cuenta: account,
  };
};
