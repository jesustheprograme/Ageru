import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

/**
 * Genera hashes seguros para secretos de usuario como contrasenas y CVV.
 * El formato almacenado incluye algoritmo y salt para permitir verificacion posterior.
 */
export const hashSecret = async (value) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(value, salt, keyLength);

  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Compara un secreto recibido contra el hash almacenado usando timingSafeEqual.
 */
export const verifySecret = async (value, storedHash = '') => {
  const [algorithm, salt, hash] = storedHash.split(':');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const storedBuffer = Buffer.from(hash, 'hex');
  const derivedKey = await scrypt(value, salt, storedBuffer.length);

  return timingSafeEqual(storedBuffer, derivedKey);
};

/**
 * Reduce un numero de tarjeta a una representacion segura para respuestas y base de datos.
 */
export const maskCardNumber = (cardNumber) => {
  const digits = String(cardNumber || '').replace(/\D/g, '');
  const lastFour = digits.slice(-4);

  return `****${lastFour}`;
};
