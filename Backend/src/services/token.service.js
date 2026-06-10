import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Genera el JWT usado por Angular para identificar la sesion.
 * El payload conserva datos minimos del usuario y el metodo de autenticacion.
 */
export const createAuthToken = ({ usuarioId, email, dni, phone, authMethod = 'password' }) => {
  return jwt.sign(
    {
      usuarioId,
      email,
      dni,
      phone,
      authMethod,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
    },
  );
};
