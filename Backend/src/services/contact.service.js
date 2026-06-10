import {
  createContact,
  findExistingContact,
  listContactsByUserId,
  removeContact,
} from '../repositories/contact.repository.js';
import { findUserByEmail, findUserById } from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

export const getUserContacts = async (usuarioId) => {
  const user = await findUserById(usuarioId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return listContactsByUserId(usuarioId);
};

export const addContact = async ({ usuarioId, email, alias, esFavorito }) => {
  const user = await findUserById(usuarioId);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const contactUser = await findUserByEmail(email);

  if (!contactUser || contactUser.estado !== 'activo') {
    throw new AppError('No existe un usuario activo con ese correo', 404);
  }

  if (String(contactUser.id).toLowerCase() === String(usuarioId).toLowerCase()) {
    throw new AppError('No puedes agregarte como contacto', 400);
  }

  const existing = await findExistingContact({
    usuarioId,
    contactoUsuarioId: contactUser.id,
  });

  if (existing) {
    throw new AppError('Ese usuario ya esta en tus contactos', 409);
  }

  return createContact({
    usuarioId,
    contactoUsuarioId: contactUser.id,
    alias,
    esFavorito,
  });
};

export const deleteContact = async ({ usuarioId, contactoId }) => {
  const affected = await removeContact({ usuarioId, contactoId });

  if (!affected) {
    throw new AppError('Contacto no encontrado', 404);
  }

  return { deleted: true };
};
