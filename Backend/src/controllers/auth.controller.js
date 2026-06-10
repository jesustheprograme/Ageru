import { sendOtp, verifyOtp } from '../services/otp.service.js';
import { loginWithPassword } from '../services/auth.service.js';
import { requestPasswordReset, resetPassword } from '../services/password-reset.service.js';
import { createAuthToken } from '../services/token.service.js';
import { registerUser } from '../services/user.service.js';
import { findAccountByUserId } from '../repositories/account.repository.js';
import { findUserByPhone } from '../repositories/user.repository.js';
import { errorResponse, successResponse } from '../utils/response.js';

/**
 * Controlador de autenticacion y recuperacion de acceso.
 *
 * Esta capa solo normaliza entradas HTTP, valida campos obligatorios y decide
 * el codigo de respuesta. Las reglas de negocio viven en los servicios.
 */
const getText = (value) => (typeof value === 'string' ? value.trim() : '');

const getRegisterPayload = (body = {}) => ({
  dni: getText(body.dni),
  telefono: getText(body.telefono),
  nombres: getText(body.nombres),
  apellidos: getText(body.apellidos),
  email: getText(body.email),
  fechaNacimiento: getText(body.fechaNacimiento),
  password: getText(body.password),
});

const getLoginPayload = (body = {}) => ({
  dni: getText(body.dni),
  email: getText(body.email),
  password: getText(body.password),
});

const getForgotPasswordPayload = (body = {}) => ({
  email: getText(body.email),
});

const getResetPasswordPayload = (body = {}) => ({
  token: getText(body.token),
  password: getText(body.password),
});

export const sendCode = async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

    if (!phone) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El telefono es obligatorio',
      });
    }

    await sendOtp(phone);

    return successResponse(res, {
      message: 'Codigo enviado',
    });
  } catch (error) {
    console.error('Error al enviar OTP:', error.message);
    return next(error);
  }
};

/**
 * Valida un codigo OTP y devuelve una sesion completa cuando el telefono pertenece a un usuario.
 */
export const verifyCode = async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';

    if (!phone) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El telefono es obligatorio',
      });
    }

    if (!code) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El codigo es obligatorio',
      });
    }

    const result = await verifyOtp(phone, code);

    if (!result.approved) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Codigo invalido o expirado',
      });
    }

    const user = await findUserByPhone(phone);

    if (!user || user.estado !== 'activo') {
      return errorResponse(res, {
        statusCode: 404,
        message: 'No existe un usuario activo vinculado a ese telefono',
      });
    }

    const account = await findAccountByUserId(user.id);
    const token = createAuthToken({
      usuarioId: user.id,
      email: user.email,
      dni: user.dni,
      phone: user.telefono,
      authMethod: 'phone_otp',
    });

    return successResponse(res, {
      message: 'Login correcto',
      data: {
        token,
        usuario: user,
        cuenta: account,
      },
    });
  } catch (error) {
    console.error('Error al validar OTP:', error.message);
    return next(error);
  }
};

/**
 * Registra un nuevo usuario con cuenta y tarjeta inicial.
 */
export const register = async (req, res, next) => {
  try {
    const payload = getRegisterPayload(req.body);

    const requiredFields = [
      ['dni', 'El DNI es obligatorio'],
      ['telefono', 'El telefono es obligatorio'],
      ['nombres', 'Los nombres son obligatorios'],
      ['apellidos', 'Los apellidos son obligatorios'],
      ['email', 'El email es obligatorio'],
      ['fechaNacimiento', 'La fecha de nacimiento es obligatoria'],
      ['password', 'La contrasena es obligatoria'],
    ];

    for (const [field, message] of requiredFields) {
      if (!payload[field]) {
        return errorResponse(res, { statusCode: 400, message });
      }
    }

    const registration = await registerUser(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Usuario registrado correctamente',
      data: { registration },
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    return next(error);
  }
};

/**
 * Inicia sesion por DNI, email y contrasena.
 */
export const login = async (req, res, next) => {
  try {
    const payload = getLoginPayload(req.body);

    if (!payload.dni) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El DNI es obligatorio',
      });
    }

    if (!/^\d{8}$/.test(payload.dni)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El DNI debe tener 8 digitos',
      });
    }

    if (!payload.email) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El email es obligatorio',
      });
    }

    if (!payload.password) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La contrasena es obligatoria',
      });
    }

    const session = await loginWithPassword(payload);

    return successResponse(res, {
      message: 'Login correcto',
      data: session,
    });
  } catch (error) {
    console.error('Error al iniciar sesion:', error.message);
    return next(error);
  }
};

/**
 * Solicita el envio de un enlace de recuperacion sin revelar si el correo existe.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const payload = getForgotPasswordPayload(req.body);

    if (!payload.email) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El email es obligatorio',
      });
    }

    await requestPasswordReset(payload.email);

    return successResponse(res, {
      message: 'Si el correo existe, enviaremos un enlace para recuperar la contrasena',
    });
  } catch (error) {
    console.error('Error al solicitar recuperacion:', error.message);
    return next(error);
  }
};

/**
 * Aplica una nueva contrasena a partir de un token de recuperacion vigente.
 */
export const resetPasswordController = async (req, res, next) => {
  try {
    const payload = getResetPasswordPayload(req.body);

    if (!payload.token) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'El token es obligatorio',
      });
    }

    if (!payload.password || payload.password.length < 6) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'La nueva contrasena debe tener al menos 6 caracteres',
      });
    }

    await resetPassword(payload);

    return successResponse(res, {
      message: 'Contrasena actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al restablecer contrasena:', error.message);
    return next(error);
  }
};
