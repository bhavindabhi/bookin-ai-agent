import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  claudeModel: process.env.CLAUDE_MODEL || "claude-opus-4-8",
  businessName: process.env.BUSINESS_NAME || "our dental supply store",

  shopifyStoreDomain: required("SHOPIFY_STORE_DOMAIN"),
  shopifyAdminApiToken: required("SHOPIFY_ADMIN_API_TOKEN"),
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION || "2024-10",

  twilioAccountSid: required("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: required("TWILIO_AUTH_TOKEN"),
  twilioWhatsAppNumber: required("TWILIO_WHATSAPP_NUMBER"),
  verifyTwilioSignature: process.env.VERIFY_TWILIO_SIGNATURE !== "false",
  publicWebhookUrl: process.env.PUBLIC_WEBHOOK_URL || "",

  port: Number(process.env.PORT || 3000),
};
