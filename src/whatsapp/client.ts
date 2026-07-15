import twilio from "twilio";
import { config } from "../config.js";

const twilioClient = twilio(config.twilioAccountSid, config.twilioAuthToken);

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const toAddress = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  await twilioClient.messages.create({
    from: config.twilioWhatsAppNumber,
    to: toAddress,
    body,
  });
}
