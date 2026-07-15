import express from "express";
import { config } from "./config.js";
import { whatsappWebhookRouter } from "./whatsapp/webhook.js";

const app = express();

// Twilio posts webhooks as application/x-www-form-urlencoded.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/webhook", whatsappWebhookRouter);

app.listen(config.port, () => {
  console.log(`Dental supply WhatsApp agent listening on port ${config.port}`);
  console.log(`Webhook endpoint: POST /webhook/whatsapp`);
});
