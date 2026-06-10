import { addContact, deleteContact, getUserContacts } from '../services/contact.service.js';
import { errorResponse, successResponse } from '../utils/response.js';

const getText = (value) => (typeof value === 'string' ? value.trim() : '');

export const listUserContactsController = async (req, res, next) => {
  try {
    const usuarioId = getText(req.params.usuarioId);

    if (!usuarioId) {
      return errorResponse(res, { statusCode: 400, message: 'El usuarioId es obligatorio' });
    }

    const contactos = await getUserContacts(usuarioId);

    return successResponse(res, {
      message: 'Contactos encontrados',
      data: { contactos },
    });
  } catch (error) {
    return next(error);
  }
};

export const createContactController = async (req, res, next) => {
  try {
    const payload = {
      usuarioId: getText(req.body.usuarioId),
      email: getText(req.body.email),
      alias: getText(req.body.alias),
      esFavorito: Boolean(req.body.esFavorito),
    };

    if (!payload.usuarioId) {
      return errorResponse(res, { statusCode: 400, message: 'El usuarioId es obligatorio' });
    }

    if (!payload.email) {
      return errorResponse(res, { statusCode: 400, message: 'El email del contacto es obligatorio' });
    }

    const contacto = await addContact(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Contacto agregado',
      data: { contacto },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteContactController = async (req, res, next) => {
  try {
    const usuarioId = getText(req.body.usuarioId);
    const contactoId = getText(req.params.id);

    if (!usuarioId) {
      return errorResponse(res, { statusCode: 400, message: 'El usuarioId es obligatorio' });
    }

    await deleteContact({ usuarioId, contactoId });

    return successResponse(res, {
      message: 'Contacto eliminado',
    });
  } catch (error) {
    return next(error);
  }
};
