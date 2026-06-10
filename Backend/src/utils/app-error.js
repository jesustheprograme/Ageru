/**
 * Error de dominio con codigo HTTP asociado.
 * Los servicios lo lanzan cuando una regla de negocio no se cumple.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
