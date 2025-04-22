import { createTransport } from 'nodemailer';

const transporter = createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: true,
});

interface SendVerificationRequestParams {
  identifier: string;
  url: string;
  expires: Date;
  provider: { server: any; from: string };
  token: string;
  theme?: {
    colorScheme?: 'auto' | 'dark' | 'light';
    brandColor?: string;
    buttonText?: string;
    logo?: string;
  };
  request?: Request;
}

export async function sendVerificationRequest(
  params: SendVerificationRequestParams,
): Promise<void> {
  const { identifier, url, provider } = params;
  const { host } = new URL(url);

  const result = await transporter.sendMail({
    to: identifier,
    from: provider.from,
    subject: `¡Inicia sesión en AI Chatbot!`,
    text: `Hola, haz clic en el siguiente enlace para iniciar sesión en AI Chatbot: ${url}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">AI Chatbot - Inicio de Sesión</h2>
        <p style="margin-bottom: 20px;">Haz clic en el siguiente botón para iniciar sesión en AI Chatbot:</p>
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${url}" style="background-color: #0070f3; color: white; padding: 12px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Iniciar Sesión</a>
        </div>
        <p style="color: #666; font-size: 14px; text-align: center;">Si no solicitaste este correo, puedes ignorarlo con seguridad.</p>
        <p style="color: #666; font-size: 14px; text-align: center;">Este enlace es válido por 24 horas y solo puede usarse una vez.</p>
      </div>
    `,
  });

  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Error al enviar el correo de verificación`);
  }
}
