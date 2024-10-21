import nodemailer from 'nodemailer';
import { Error } from './db';
import type { H3Event } from 'h3';

function useMail(event: H3Event): nodemailer.Transporter | undefined {
  const config = useRuntimeConfig(event);

  const mailConfig = config.mail;

  if (!mailConfig.host || !mailConfig.port || !mailConfig.username || !mailConfig.password) {
    console.info('No mail config found, skipping mail initialization');
    return;
  }

  return nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    requireTLS: mailConfig.requireTLS,
    auth: {
      user: mailConfig.username,
      pass: mailConfig.password,
    },
  });
}

export async function sendNewErrorMail(event: H3Event, to: string, error: Error) {
  const mail = useMail(event);
  if (!mail) {
    return;
  }

  const config = useRuntimeConfig(event);
  const host = config.publicHost || 'http://localhost:3000';
  const url = `${host}/projects/${error.projectId}/errors/${error.id}`;
  const text = `
A new error occurred: ${error.title}

${error.value}

Find more details at ${url}
  `.trim();

  await mail.sendMail({
    from: config.mail.from,
    to,
    subject: `New error: ${error.title.slice(0, 50)}`,
    text,
  });
}
