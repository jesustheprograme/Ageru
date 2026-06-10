/**
 * Respuesta estandar para rutas inexistentes.
 * Debe registrarse despues de todas las rutas de la API.
 */
export const notFoundMiddleware = (req, res) => {
  return res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada',
  });
};

/**
 * Manejador global de errores.
 *
 * Convierte excepciones de dominio y errores de SQL Server en respuestas JSON
 * consistentes para el frontend.
 */
export const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      message: 'El cuerpo de la solicitud no tiene un JSON valido',
    });
  }

  if (error.number === 2601 || error.number === 2627) {
    return res.status(409).json({
      ok: false,
      message: 'Ya existe un registro con esos datos',
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    ok: false,
    message: statusCode === 500 ? 'No se pudo procesar la solicitud' : error.message,
  });
};
