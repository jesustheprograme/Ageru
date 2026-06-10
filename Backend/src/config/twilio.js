import twilio from 'twilio';
import { env } from './env.js';

let client;

/**
 * Crea una unica instancia del cliente Twilio.
 *
 * Los servicios de OTP consumen este cliente para enviar y validar codigos
 * usando Twilio Verify.
 */
export const getTwilioClient = () => {
  if (!client) {
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }

  return client;
};

export const verifyServiceSid = env.twilio.verifyServiceSid;
