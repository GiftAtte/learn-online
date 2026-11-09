import { env } from '../../config/env';
import type { Mail } from './mailer';

const link = (path: string, token: string) =>
  `${env.CLIENT_ORIGIN.replace(/\/$/, '')}${path}?token=${encodeURIComponent(token)}`;

const layout = (heading: string, body: string, url: string, button: string, footer: string) => ({
  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1c2b27">
<h2 style="color:#1f4d43">${heading}</h2><p>${body}</p>
<p><a href="${url}" style="display:inline-block;background:#1f4d43;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none">${button}</a></p>
<p style="font-size:13px;color:#667">Or paste this address into your browser:<br>${url}</p>
<p style="font-size:13px;color:#667">${footer}</p></div>`,
});

export const resetPasswordMail = (to: string, name: string, token: string): Mail => {
  const url = link('/reset-password', token);
  const minutes = env.EMAIL_TOKEN_MINUTES;
  return {
    to,
    subject: 'Reset your password',
    text: `Hi ${name},\n\nChoose a new password: ${url}\n\nThe link works for ${minutes} minutes and only once. If you did not ask for this, ignore this email.`,
    ...layout(
      'Reset your password',
      `Hi ${name}, we got a request to reset your password.`,
      url,
      'Choose a new password',
      `The link works for ${minutes} minutes and only once. If you did not ask for this, ignore this email; your password is unchanged.`,
    ),
  };
};
