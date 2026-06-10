import {
  confirmTransaction,
  createOperation,
  getAccountTransactions,
  getUserTransactions,
} from '../services/transaction.service.js';
import { errorResponse, successResponse } from '../utils/response.js';

const getText = (value) => (typeof value === 'string' ? value.trim() : '');

const getTransferPayload = (body = {}) => ({
  usuarioId: getText(body.usuarioId),
  cuentaOrigenId: getText(body.cuentaOrigenId),
  codigoCuentaDestino: getText(body.codigoCuentaDestino),
  contactoId: getText(body.contactoId || body.idContacto || body.id_contacto),
  monto: body.monto,
  descripcion: getText(body.descripcion),
  code: getText(body.code),
});

const validateTransferPayload = (payload, { requireCode = false } = {}) => {
  const requiredFields = [
    ['usuarioId', 'El usuarioId es obligatorio'],
    ['cuentaOrigenId', 'El cuentaOrigenId es obligatorio'],
  ];

  if (requireCode) {
    requiredFields.push(['code', 'El codigo OTP es obligatorio']);
  }

  for (const [field, message] of requiredFields) {
    if (!payload[field]) {
      return message;
    }
  }

  if (!payload.contactoId && !payload.codigoCuentaDestino) {
    return 'Selecciona un contacto o ingresa el codigo de cuenta destino';
  }

  if (payload.monto === undefined || payload.monto === null || payload.monto === '') {
    return 'El monto es obligatorio';
  }

  return null;
};

const getOperationPayload = (body = {}) => ({
  usuarioId: getText(body.usuarioId),
  cuentaId: getText(body.cuentaId),
  tipo: getText(body.tipo),
  monto: body.monto,
  descripcion: getText(body.descripcion),
});

const validateOperationPayload = (payload) => {
  const requiredFields = [
    ['usuarioId', 'El usuarioId es obligatorio'],
    ['cuentaId', 'El cuentaId es obligatorio'],
    ['tipo', 'El tipo de operacion es obligatorio'],
  ];

  for (const [field, message] of requiredFields) {
    if (!payload[field]) {
      return message;
    }
  }

  if (payload.monto === undefined || payload.monto === null || payload.monto === '') {
    return 'El monto es obligatorio';
  }

  return null;
};

export const listUserTransactionsController = async (req, res, next) => {
  try {
    const usuarioId = getText(req.params.usuarioId);

    if (!usuarioId) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El usuarioId es obligatorio',
      });
    }

    const transacciones = await getUserTransactions(usuarioId);

    return successResponse(res, {
      message: 'Transacciones encontradas',
      data: { transacciones },
    });
  } catch (error) {
    return next(error);
  }
};

export const listAccountTransactionsController = async (req, res, next) => {
  try {
    const usuarioId = getText(req.params.usuarioId);
    const cuentaId = getText(req.params.cuentaId);

    if (!usuarioId) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El usuarioId es obligatorio',
      });
    }

    if (!cuentaId) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El cuentaId es obligatorio',
      });
    }

    const transacciones = await getAccountTransactions({ usuarioId, cuentaId });

    return successResponse(res, {
      message: 'Transacciones de cuenta encontradas',
      data: { transacciones },
    });
  } catch (error) {
    return next(error);
  }
};

export const confirmTransactionController = async (req, res, next) => {
  try {
    const payload = getTransferPayload(req.body);
    const validationMessage = validateTransferPayload(payload, { requireCode: true });

    if (validationMessage) {
      return errorResponse(res, {
        statusCode: 400,
        message: validationMessage,
      });
    }

    const result = await confirmTransaction(payload);

    return successResponse(res, {
      message: 'Transferencia completada',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createOperationController = async (req, res, next) => {
  try {
    const payload = getOperationPayload(req.body);
    const validationMessage = validateOperationPayload(payload);

    if (validationMessage) {
      return errorResponse(res, {
        statusCode: 400,
        message: validationMessage,
      });
    }

    const result = await createOperation(payload);

    return successResponse(res, {
      message: 'Operacion completada',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
