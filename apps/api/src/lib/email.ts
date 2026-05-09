import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

const BUTTON_STYLE =
  'display:inline-block;padding:12px 24px;background-color:#0f766e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;';

function wrap(title: string, body: string, buttonLabel: string, buttonUrl: string, expiry: string) {
  return `<!doctype html>
<html lang="pt-br">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#0f172a;background-color:#f8fafc;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:8px;padding:32px;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${title}</h2>
      <p style="margin:0 0 24px;color:#475569;">${body}</p>
      <p style="margin:0 0 24px;">
        <a href="${buttonUrl}" style="${BUTTON_STYLE}">${buttonLabel}</a>
      </p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">${expiry}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
    </div>
  </body>
</html>`;
}

async function send(to: string, subject: string, html: string, label: string): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM_NOREPLY,
      to,
      subject,
      html
    });
    if (result.error) {
      console.error(`[email] resend rejected ${label}`, { to, error: result.error });
    }
  } catch (err) {
    console.error(`[email] failed to send ${label}`, { to, err });
  }
}

export async function sendInviteEmail(to: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = wrap(
    'Bem-vindo ao Sistema Ibanje',
    'Sua conta foi criada. Clique no botão abaixo para definir sua senha e acessar o sistema.',
    'Definir senha',
    link,
    'Este link expira em 24 horas.'
  );
  await send(to, 'Bem-vindo ao Sistema Ibanje', html, 'invite email');
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = wrap(
    'Redefinição de senha',
    'Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.',
    'Redefinir senha',
    link,
    'Este link expira em 1 hora.'
  );
  await send(to, 'Redefinição de senha', html, 'password reset email');
}
