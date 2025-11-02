import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendPasswordResetEmail(to: string, resetUrl: string, ttl: number) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const ttlMinutes = Math.round(ttl / 60);

  const html = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir sua senha. Clique nesse <a href="${resetUrl}">link</a> para prosseguir:</p>
    <p>Se o link acima não funcionar, copie e cole o seguinte endereço no seu navegador:</p>
    <p><code>${resetUrl}</code></p>
    <p>Se não solicitou, ignore este e-mail.</p>
    <hr/>
    <p>Este link expira em ${ttlMinutes} minutos.</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: 'Redefinir senha',
    text: `
Olá,

Recebemos uma solicitação para redefinir sua senha.

Abra o link abaixo para prosseguir:
${resetUrl}

Se não solicitou, ignore este e-mail.
Este link expira em ${ttlMinutes} minutos.
    `,
    html
  });
}
