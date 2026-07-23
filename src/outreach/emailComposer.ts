import { completeText } from "../llm/client.js";
import type { BusinessInfo } from "../config/business.js";
import type { Pricebook } from "../pricing/pricebook.js";

export interface LeadLike {
  name: string;
  category: string;
  country: string;
  contactName?: string | null;
}

export interface DraftEmail {
  subject: string;
  body: string;
}

const OPT_OUT_NOTE =
  "If you'd rather not receive future messages like this, just reply \"unsubscribe\" and I won't contact you again.";

/**
 * Composes the initial B2B outreach email for a lead. Uses Claude for a
 * personalized note if ANTHROPIC_API_KEY is set; otherwise falls back to a
 * plain template so the agent works with zero LLM setup.
 */
export async function composeOutreachEmail(
  lead: LeadLike,
  business: BusinessInfo,
  pricebook?: Pricebook
): Promise<DraftEmail> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return templateOutreachEmail(lead, business);
  }

  const productLine = pricebook
    ? pricebook.products.map((p) => `- ${p.name} (${p.sku})`).join("\n")
    : "- Dental consumables and materials (gloves, composites, impression materials, and more)";

  const system = `You write short, professional, non-spammy B2B cold outreach emails introducing a dental materials supplier to a potential regular buyer (dental clinic, lab, or distributor). Tone: warm, direct, low-pressure. No hype/superlatives. Keep it under 150 words. Output ONLY valid JSON: {"subject": string, "body": string}. The body must be plain text (no markdown), must clearly identify our business and that we trade B2B in dental materials, must include the sender's name and business name, and must end with the exact opt-out line provided.`;

  const user = `Recipient business: ${lead.name} (${lead.category}, ${lead.country})${
    lead.contactName ? `\nContact: ${lead.contactName}` : ""
  }

Our business: ${business.businessName}, sender ${business.senderName} <${business.senderEmail}>, address: ${business.address}

Our product range (sample, do not list all — mention 1-2 relevant categories):
${productLine}

Goal: introduce ourselves as a reliable B2B trade supplier for their regular dental material needs, invite them to get in touch with what they currently buy and volumes so we can follow up with pricing. Include this exact opt-out line verbatim at the end of the body: "${OPT_OUT_NOTE}"`;

  const raw = await completeText(system, user);
  return parseJsonEmail(raw);
}

function templateOutreachEmail(lead: LeadLike, business: BusinessInfo): DraftEmail {
  const greeting = lead.contactName ? `Hello ${lead.contactName},` : "Hello,";
  const subject = `B2B dental materials supply — ${business.businessName}`;
  const body = `${greeting}

My name is ${business.senderName} from ${business.businessName}. We trade B2B in dental products and materials, supplying clinics, labs, and distributors both locally and internationally.

We'd like to be considered as a regular supplier for ${lead.name}. If you can let us know what you currently purchase and typical volumes, we'll follow up with pricing tailored to your needs.

Best regards,
${business.senderName}
${business.businessName}
${business.senderEmail}
${business.address}

${OPT_OUT_NOTE}`;
  return { subject, body };
}

function parseJsonEmail(raw: string): DraftEmail {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`LLM did not return JSON email:\n${raw}`);
  const parsed = JSON.parse(jsonMatch[0]) as Partial<DraftEmail>;
  if (!parsed.subject || !parsed.body) throw new Error(`LLM JSON missing subject/body:\n${raw}`);
  return { subject: parsed.subject, body: parsed.body };
}
