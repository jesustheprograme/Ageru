import { addUserCard, getCardsByUserId } from '../services/card.service.js';
import { errorResponse, successResponse } from '../utils/response.js';

/**
 * Controladores de tarjetas.
 * Validan datos obligatorios antes de delegar la creacion o consulta al servicio.
 */
const getText = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Registra una tarjeta para un usuario y cuenta existentes.
 */
export const createCardController = async (req, res, next) => {
  try {
    const payload = {
      usuarioId: getText(req.body.usuarioId),
      cuentaId: getText(req.body.cuentaId),
      numTarjeta: getText(req.body.numTarjeta),
      fechaCaducidad: getText(req.body.fechaCaducidad),
      cvv: getText(req.body.cvv),
    };

    const requiredFields = [
      ['usuarioId', 'El usuarioId es obligatorio'],
      ['cuentaId', 'El cuentaId es obligatorio'],
      ['numTarjeta', 'El numero de tarjeta es obligatorio'],
      ['fechaCaducidad', 'La fecha de caducidad es obligatoria'],
      ['cvv', 'El CVV es obligatorio'],
    ];

    for (const [field, message] of requiredFields) {
      if (!payload[field]) {
        return errorResponse(res, { statusCode: 400, message });
      }
    }

    const tarjeta = await addUserCard(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Tarjeta registrada correctamente',
      data: { tarjeta },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lista las tarjetas asociadas a un usuario.
 */
export const listUserCardsController = async (req, res, next) => {
  try {
    const tarjetas = await getCardsByUserId(req.params.usuarioId);

    return successResponse(res, {
      message: 'Tarjetas encontradas',
      data: { tarjetas },
    });
  } catch (error) {
    return next(error);
  }
};
