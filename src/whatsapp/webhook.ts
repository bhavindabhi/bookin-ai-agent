import { Router, type Request } from "express";
import twilio from "twilio";
import { config } from "../config.js";
import { findCustomerByPhone } from "../shopify/customers.js";
import { handleIncomingMessage } from "../agent/claude.js";
import { sendWhatsAppMessage } from "./client.js";

export const whatsappWebhookRouter = Router();

function resolveRequestUrl(req: Request): string {
  if (config.publicWebhookUrl) return config.publicWebhookUrl;
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

whatsappWebhookRouter.post("/whatsapp", async (req, res) => {
  if (config.verifyTwilioSignature) {
    const signature = req.header("X-Twilio-Signature") ?? "";
    const isValid = twilio.validateRequest(
      config.twilioAuthToken,
      signature,
      resolveRequestUrl(req),
      req.body as Record<string, string>,
    );
    if (!isValid) {
      res.status(403).send("Invalid Twilio signature");
      return;
    }
  }

  const from = String(req.body.From ?? "");
  const body = String(req.body.Body ?? "").trim();

  // Acknowledge immediately — Claude + Shopify round trips (especially with
  // multiple tool calls) can take longer than webhook timeout budgets allow,
  // so the actual reply is sent asynchronously via the Twilio REST API below.
  res.type("text/xml").send("<Response></Response>");

  if (!from || !body) return;

  try {
    const customer = await findCustomerByPhone(from);
    const reply = await handleIncomingMessage(from, body, customer);
    await sendWhatsAppMessage(from, reply);
  } catch (error) {
    console.error("Error handling WhatsApp message:", error);
    try {
      await sendWhatsAppMessage(
        from,
        "Sorry, something went wrong processing your message. A team member will follow up shortly.",
      );
    } catch (sendError) {
      console.error("Failed to send fallback error message:", sendError);
    }
  }
});
