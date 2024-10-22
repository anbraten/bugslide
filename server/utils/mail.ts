import nodemailer from 'nodemailer';
import type { H3Event } from 'h3';

export function useMail(event: H3Event): nodemailer.Transporter | undefined {
  const config = useRuntimeConfig(event);

  const mailConfig = config.mail;

  if (!mailConfig.host || !mailConfig.port || !mailConfig.username || !mailConfig.password) {
    console.info('No mail config found, skipping mail initialization');
    return undefined;
  }

  return nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: isTrue(mailConfig.secure),
    requireTLS: isTrue(mailConfig.requireTLS),
    auth: {
      user: mailConfig.username,
      pass: mailConfig.password,
    },
    from: mailConfig.from,
  });
}

function isTrue(value: any): boolean {
  return value === 'true' || value === '1' || value === 'yes' || value === true;
}
