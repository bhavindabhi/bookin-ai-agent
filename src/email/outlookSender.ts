import nodemailer, { type Transporter } from "nodemailer";

export interface SendResult {
  ok: boolean;
  error?: string;
}

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error(
        "EMAIL_USER / EMAIL_APP_PASSWORD not set (see .env.example) — required to actually send from Outlook."
      );
    }
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST ?? "smtp.office365.com",
      port: Number(process.env.EMAIL_SMTP_PORT ?? 587),
      secure: false, // STARTTLS on 587
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  try {
    const from = process.env.EMAIL_USER as string;
    await getTransporter().sendMail({ from, to, subject, text: body });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
