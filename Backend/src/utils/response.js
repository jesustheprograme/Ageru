/**
 * Formato comun para respuestas exitosas de la API.
 * Los controladores lo usan para mantener estable el contrato con Angular.
 */
export const successResponse = (res, { statusCode = 200, message, data = {} }) => {
  return res.status(statusCode).json({
    ok: true,
    message,
    ...data,
  });
};

/**
 * Formato comun para errores de validacion manejados en controladores.
 */
export const errorResponse = (res, { statusCode = 400, message }) => {
  return res.status(statusCode).json({
    ok: false,
    message,
  });
};
