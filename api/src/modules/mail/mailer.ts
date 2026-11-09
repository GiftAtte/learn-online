import nodemailer from 'nodemailer';
import { env, isTest } from '../../config/env';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** In tests nothing is sent; messages collect here so a test can read the link that was "emailed". */
export const outbox: Mail[] = [];

const transport =
  env.MAIL_USER && env.MAIL_PASS
    ? nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
      })
    : null;

/**
 * Sends one email (Mailtrap by default). Never throws: a mail problem must not break sign-up or the
 * "forgot password" answer, so failures are logged. Without SMTP credentials the message is printed.
 */
export const sendMail = async (mail: Mail) => {
  if (isTest) {
    outbox.push(mail);
    return;
  }
  if (!transport) {
    console.log(`[mail not configured] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}`);
    return;
  }
  try {
    await transport.sendMail({ from: env.MAIL_FROM, ...mail });
  } catch (error) {
    console.error('Could not send email:', error instanceof Error ? error.message : error);
  }
};
