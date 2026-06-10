import { getTwilioClient, verifyServiceSid } from '../config/twilio.js';

/**
 * Envia un codigo OTP por SMS usando Twilio Verify.
 */
export const sendOtp = async (phone) => {
  const client = getTwilioClient();

  const verification = await client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: phone,
      channel: 'sms',
    });

  return {
    status: verification.status,
  };
};

/**
 * Verifica el codigo OTP ingresado por el usuario contra Twilio Verify.
 */
export const verifyOtp = async (phone, code) => {
  const client = getTwilioClient();

  const verificationCheck = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: phone,
      code,
    });

  return {
    approved: verificationCheck.status === 'approved',
    status: verificationCheck.status,
  };
};
