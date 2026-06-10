import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

/**
 * Verifica configuracion SMTP antes de intentar enviar correos.
 */
const assertMailConfig = () => {
  const missing = [];

  if (!env.mail.host) missing.push('SMTP_HOST');
  if (!env.mail.user) missing.push('SMTP_USER');
  if (!env.mail.password) missing.push('SMTP_PASS');
  if (!env.mail.from) missing.push('MAIL_FROM');

  if (missing.length > 0) {
    throw new AppError(`Faltan variables SMTP: ${missing.join(', ')}`, 500);
  }
};

/**
 * Crea el transporte SMTP con la configuracion centralizada.
 */
const getTransporter = () => {
  assertMailConfig();

  return nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.password,
    },
  });
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/**
 * Envia el correo transaccional para recuperar contrasena.
 * Incluye version texto y HTML para mayor compatibilidad.
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = getTransporter();
  const displayName = name || 'usuario';
  const safeDisplayName = escapeHtml(displayName);
  const safeResetUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject: 'Recupera tu contrasena de Ageru',
    text: [
      `Hola ${displayName},`,
      '',
      'Recibimos una solicitud para cambiar tu contrasena de Ageru.',
      `Abre este enlace para crear una nueva contrasena: ${resetUrl}`,
      '',
      'El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este correo.',
    ].join('\n'),
    html: `
      <p>Hola ${safeDisplayName},</p>
      <p>Recibimos una solicitud para cambiar tu contrasena de Ageru.</p>
      <p><a href="${safeResetUrl}">Crear nueva contrasena</a></p>
      <p>El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este correo.</p>
    `,
  });
};

/**
 * Punto publico para validar que el canal de correo esta listo.
 */
export const ensureMailCanSend = () => {
  assertMailConfig();
};
