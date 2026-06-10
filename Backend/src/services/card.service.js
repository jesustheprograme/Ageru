import { randomInt } from 'node:crypto';
import { findAccountById } from '../repositories/account.repository.js';
import { createCard, listCardsByUserId } from '../repositories/card.repository.js';
import { AppError } from '../utils/app-error.js';
import { hashSecret, maskCardNumber } from '../utils/password.js';

const cardNumberLength = 16;

// Generadores internos usados cuando el registro crea una tarjeta inicial automaticamente.
const randomDigits = (length) => Array.from({ length }, () => randomInt(0, 10)).join('');

const getLuhnCheckDigit = (value) => {
  const sum = String(value)
    .split('')
    .reverse()
    .reduce((total, digit, index) => {
      let current = Number(digit);

      if (index % 2 === 0) {
        current *= 2;

        if (current > 9) {
          current -= 9;
        }
      }

      return total + current;
    }, 0);

  return String((10 - (sum % 10)) % 10);
};

const generateCardNumber = () => {
  const base = `4${randomDigits(cardNumberLength - 2)}`;

  return `${base}${getLuhnCheckDigit(base)}`;
};

const generateExpirationDate = () => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 5);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);

  return date.toISOString().slice(0, 10);
};

const generateCvv = () => String(randomInt(0, 1000)).padStart(3, '0');

/**
 * Crea una tarjeta validando que pertenezca a la cuenta del usuario.
 *
 * Solo se persiste el numero enmascarado y el CVV hasheado para reducir exposicion
 * de datos sensibles.
 */
export const addUserCard = async ({ usuarioId, cuentaId, numTarjeta, fechaCaducidad, cvv }) => {
  const expirationDate = new Date(fechaCaducidad);

  if (Number.isNaN(expirationDate.getTime())) {
    throw new AppError('La fecha de caducidad no es valida');
  }

  const account = await findAccountById(cuentaId);

  if (!account) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  if (String(account.usuario_id).toLowerCase() !== String(usuarioId).toLowerCase()) {
    throw new AppError('La cuenta no pertenece al usuario indicado', 400);
  }

  const digits = String(numTarjeta || '').replace(/\D/g, '');

  if (digits.length < 4) {
    throw new AppError('El numero de tarjeta debe tener al menos 4 digitos');
  }

  const cvvDigits = String(cvv || '').replace(/\D/g, '');

  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    throw new AppError('El CVV debe tener 3 o 4 digitos');
  }

  const cvvHash = await hashSecret(cvvDigits);

  return createCard({
    usuarioId,
    cuentaId,
    numTarjeta: maskCardNumber(digits),
    fechaCaducidad,
    cvvHash,
    estado: 'activo',
  });
};

/**
 * Emite una tarjeta virtual inicial para el alta de usuario.
 */
export const createAutomaticUserCard = ({ usuarioId, cuentaId }) =>
  addUserCard({
    usuarioId,
    cuentaId,
    numTarjeta: generateCardNumber(),
    fechaCaducidad: generateExpirationDate(),
    cvv: generateCvv(),
  });

/**
 * Consulta tarjetas visibles para un usuario.
 */
export const getCardsByUserId = (usuarioId) => listCardsByUserId(usuarioId);
