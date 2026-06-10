import { findAccountById, findAccountByUserId } from '../repositories/account.repository.js';
import {
  createAccountOperation,
  createCompletedTransfer,
  findAccountByContactId,
  findAccountByMaskedNumber,
  listTransactionsByAccountId,
  listTransactionsByUserId,
} from '../repositories/transaction.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';
import { verifyOtp } from './otp.service.js';

const toCentavos = (monto) => {
  const numericValue = Number(monto);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new AppError('El monto debe ser mayor a cero', 400);
  }

  const montoCentavos = Math.round(numericValue * 100);

  if (montoCentavos <= 0) {
    throw new AppError('El monto minimo es S/ 0.01', 400);
  }

  return montoCentavos;
};

const getTransferContext = async ({ usuarioId, cuentaOrigenId, codigoCuentaDestino, contactoId, monto }) => {
  const user = await findUserById(usuarioId);

  if (!user || user.estado !== 'activo') {
    throw new AppError('Usuario no encontrado o inactivo', 404);
  }

  const originAccount = await findAccountById(cuentaOrigenId);

  if (!originAccount) {
    throw new AppError('Cuenta origen no encontrada', 404);
  }

  if (String(originAccount.usuario_id).toLowerCase() !== String(usuarioId).toLowerCase()) {
    throw new AppError('La cuenta origen no pertenece al usuario', 403);
  }

  if (originAccount.estado !== 'activo') {
    throw new AppError('La cuenta origen no esta activa', 400);
  }

  const cleanContactId = typeof contactoId === 'string' ? contactoId.trim() : '';
  const destinationCode = typeof codigoCuentaDestino === 'string' ? codigoCuentaDestino.trim() : '';

  if (!cleanContactId && !destinationCode) {
    throw new AppError('Selecciona un contacto o ingresa el codigo de cuenta destino', 400);
  }

  const destinationAccount = cleanContactId
    ? await findAccountByContactId({ usuarioId, contactoId: cleanContactId })
    : await findAccountByMaskedNumber(destinationCode);

  if (!destinationAccount) {
    throw new AppError('Cuenta destino no encontrada', 404);
  }

  if (destinationAccount.estado !== 'activo') {
    throw new AppError('La cuenta destino no esta activa', 400);
  }

  if (String(destinationAccount.id).toLowerCase() === String(originAccount.id).toLowerCase()) {
    throw new AppError('No puedes transferir a la misma cuenta', 400);
  }

  const montoCentavos = toCentavos(monto);

  if (Number(originAccount.saldo_centavos) < montoCentavos) {
    throw new AppError('Saldo insuficiente', 400);
  }

  return {
    user,
    originAccount,
    destinationAccount,
    montoCentavos,
  };
};

/**
 * Devuelve los movimientos propios del usuario autenticado en la sesion web.
 */
export const getUserTransactions = async (usuarioId) => {
  const account = await findAccountByUserId(usuarioId);

  if (!account) {
    throw new AppError('El usuario no tiene cuenta registrada', 404);
  }

  return listTransactionsByUserId(usuarioId);
};

/**
 * Devuelve los movimientos de una sola cuenta, validando pertenencia al usuario.
 */
export const getAccountTransactions = async ({ usuarioId, cuentaId }) => {
  const account = await findAccountById(cuentaId);

  if (!account) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  if (String(account.usuario_id).toLowerCase() !== String(usuarioId).toLowerCase()) {
    throw new AppError('La cuenta no pertenece al usuario', 403);
  }

  return listTransactionsByAccountId({ usuarioId, cuentaId });
};

/**
 * Verifica OTP y confirma la transferencia de saldo en SQL Server.
 */
export const confirmTransaction = async ({
  usuarioId,
  cuentaOrigenId,
  codigoCuentaDestino,
  contactoId,
  monto,
  descripcion,
  code,
}) => {
  const context = await getTransferContext({
    usuarioId,
    cuentaOrigenId,
    codigoCuentaDestino,
    contactoId,
    monto,
  });

  const cleanCode = typeof code === 'string' ? code.trim() : '';

  if (!cleanCode) {
    throw new AppError('El codigo OTP es obligatorio', 400);
  }

  // Bypass de Twilio: Si el código es '0000', saltamos la verificación real
  if (cleanCode !== '0000') {
    const verification = await verifyOtp(context.user.telefono, cleanCode);

    if (!verification.approved) {
      throw new AppError('Codigo invalido o expirado', 401);
    }
  }

  try {
    return await createCompletedTransfer({
      cuentaOrigenId,
      cuentaDestinoId: context.destinationAccount.id,
      montoCentavos: context.montoCentavos,
      descripcion: typeof descripcion === 'string' ? descripcion.trim().slice(0, 255) : '',
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new AppError('Saldo insuficiente', 400);
    }

    if (error.code === 'INACTIVE_ACCOUNT') {
      throw new AppError('Las cuentas deben estar activas', 400);
    }

    if (error.code === 'ACCOUNT_NOT_FOUND') {
      throw new AppError('Cuenta no encontrada', 404);
    }

    throw error;
  }
};

const allowedOperations = new Set(['recarga', 'retiro', 'pago_servicio']);

/**
 * Ejecuta operaciones simples de cuenta: recarga, retiro y pago de servicios.
 */
export const createOperation = async ({ usuarioId, cuentaId, tipo, monto, descripcion }) => {
  const cleanType = typeof tipo === 'string' ? tipo.trim() : '';

  if (!allowedOperations.has(cleanType)) {
    throw new AppError('Tipo de operacion no permitido', 400);
  }

  const user = await findUserById(usuarioId);

  if (!user || user.estado !== 'activo') {
    throw new AppError('Usuario no encontrado o inactivo', 404);
  }

  const account = await findAccountById(cuentaId);

  if (!account) {
    throw new AppError('Cuenta no encontrada', 404);
  }

  if (String(account.usuario_id).toLowerCase() !== String(usuarioId).toLowerCase()) {
    throw new AppError('La cuenta no pertenece al usuario', 403);
  }

  const montoCentavos = toCentavos(monto);

  try {
    return await createAccountOperation({
      cuentaId,
      montoCentavos,
      tipo: cleanType,
      descripcion: typeof descripcion === 'string' ? descripcion.trim().slice(0, 255) : '',
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new AppError('Saldo insuficiente', 400);
    }

    if (error.code === 'INACTIVE_ACCOUNT') {
      throw new AppError('La cuenta debe estar activa', 400);
    }

    if (error.code === 'ACCOUNT_NOT_FOUND') {
      throw new AppError('Cuenta no encontrada', 404);
    }

    throw error;
  }
};
