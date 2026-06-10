import app from './app.js';
import { env, validateEnv } from './config/env.js';

/**
 * Punto de arranque del backend.
 *
 * Valida que las variables requeridas esten disponibles antes de abrir el
 * puerto; asi se evita iniciar la API en un estado incompleto.
 */
validateEnv();

app.listen(env.port, () => {
  console.log(`Servidor corriendo en http://localhost:${env.port}`);
});
