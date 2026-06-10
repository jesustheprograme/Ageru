import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Variables minimas para levantar autenticacion, base de datos y verificacion por SMS.
const requiredEnv = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'JWT_SECRET',
  'DB_SERVER',
  'DB_NAME',
];

/**
 * Configuracion normalizada de la aplicacion.
 *
 * El resto del backend debe leer desde este objeto en lugar de acceder
 * directamente a process.env, manteniendo defaults y conversiones en un solo lugar.
 */
export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
  },
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    auth: process.env.DB_AUTH || 'sql',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
  },
};

/**
 * Detiene el arranque cuando falta una variable critica.
 * En modo SQL Server con usuario/contrasena tambien exige DB_USER y DB_PASSWORD.
 */
export const validateEnv = () => {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if ((process.env.DB_AUTH || 'sql') === 'sql') {
    if (!process.env.DB_USER) missing.push('DB_USER');
    if (!process.env.DB_PASSWORD) missing.push('DB_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
};
