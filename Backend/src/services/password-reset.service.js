import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import {
  createPasswordResetToken,
  findPasswordResetTokenByHash,
  markOpenPasswordResetTokensUsed,
  markPasswordResetTokenUsed,
} from '../repositories/password-reset.repository.js';
import { setPasswordHash } from '../repositories/auth.repository.js';
import { findUserByEmail, findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { hashSecret } from '../utils/password.js';
import { ensureMailCanSend, sendPasswordResetEmail } from './email.service.js';

const resetTokenMinutes = 30;
const resetPath = '/reset-password';

// Los tokens enviados por correo nunca se guardan en claro; solo se persiste su hash.
const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');

/**
 * Construye el enlace que abrira Angular para capturar la nueva contrasena.
 */
const buildResetUrl = (token) => {
  const url = new URL(resetPath, env.frontendUrl);
  url.searchParams.set('token', token);

  return url.toString();
};

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/**
 * Crea y envia un token de recuperacion de contrasena.
 *
 * Si el correo no existe o el usuario no esta activo, responde de forma silenciosa
 * para evitar enumeracion de cuentas.
 */
export const requestPasswordReset = async (email) => {
  ensureMailCanSend();

  const user = await findUserByEmail(email);

  if (!user || user.estado !== 'activo') {
    return;
  }

  await markOpenPasswordResetTokensUsed(user.id);

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + resetTokenMinutes * 60 * 1000);

  await createPasswordResetToken({
    usuarioId: user.id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail({
    to: user.email,
    name: user.nombres,
    resetUrl: buildResetUrl(token),
  });
};

/**
 * Valida el token de recuperacion y actualiza la contrasena del usuario.
 */
export const resetPassword = async ({ token, password }) => {
  const tokenHash = hashResetToken(token);
  const resetToken = await findPasswordResetTokenByHash(tokenHash);

  if (!resetToken || resetToken.used_at) {
    throw new AppError('El enlace de recuperacion no es valido o ya fue usado', 400);
  }

  if (toDate(resetToken.expires_at).getTime() < Date.now()) {
    await markPasswordResetTokenUsed(resetToken.id);
    throw new AppError('El enlace de recuperacion expiro', 400);
  }

  const user = await findUserById(resetToken.usuario_id);

  if (!user || user.estado !== 'activo') {
    throw new AppError('El usuario no esta activo', 400);
  }

  const passwordHash = await hashSecret(password);
  await setPasswordHash(user.id, passwordHash);
  await markOpenPasswordResetTokensUsed(user.id);
};
