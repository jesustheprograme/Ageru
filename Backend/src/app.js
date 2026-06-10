import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import accountRoutes from './routes/account.routes.js';
import authRoutes from './routes/auth.routes.js';
import cardRoutes from './routes/card.routes.js';
import contactRoutes from './routes/contact.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import userRoutes from './routes/user.routes.js';

/**
 * Aplicacion HTTP principal de Ageru.
 *
 * Centraliza middlewares globales, endpoints de salud y rutas versionadas.
 * La logica de negocio queda delegada a controladores y servicios para que
 * este archivo solo describa como se expone la API.
 */
const app = express();

// CORS se valida contra la lista configurada en entorno para permitir el frontend y herramientas locales.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origen no permitido por CORS'));
    },
  }),
);
app.use(express.json());

// Health check simple para validar que el proceso Express esta vivo.
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Backend funcionando correctamente',
  });
});

// Health check de API usado por el frontend o por pruebas manuales.
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    message: 'API de Ageru funcionando',
  });
});

// Modulos funcionales de la API. Cada ruta delega validaciones HTTP al controlador correspondiente.
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/cuentas', accountRoutes);
app.use('/api/tarjetas', cardRoutes);
app.use('/api/contactos', contactRoutes);
app.use('/api/transacciones', transactionRoutes);

// Los manejadores de error siempre quedan al final para capturar rutas no encontradas y excepciones.
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
