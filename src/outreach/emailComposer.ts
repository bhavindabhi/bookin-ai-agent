import { completeText } from "../llm/client.js";
import type { BusinessInfo } from "../config/business.js";
import type { Pricebook } from "../pricing/pricebook.js";
import type { NegotiationResult } from "../pricing/negotiationEngine.js";

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

export async function composeOutreachEmail(
  lead: LeadLike,
  pricebook: Pricebook,
  business: BusinessInfo
): Promise<DraftEmail> {
  const productList = pricebook.products
    .map((p) => `- ${p.name} (${p.sku}): from ${pricebook.currency} ${p.listPrice} per ${p.unit}, better pricing at volume`)
    .join("\n");

  const system = `You write short, professional, non-spammy B2B cold outreach emails introducing a dental products supplier to a potential regular buyer (dental clinic, lab, or distributor). Tone: warm, direct, low-pressure. No hype/superlatives. Keep it under 150 words. Output ONLY valid JSON: {"subject": string, "body": string}. The body must be plain text (no markdown), must include the sender's name and business name, and must end with the exact opt-out line provided.`;

  const user = `Recipient business: ${lead.name} (${lead.category}, ${lead.country})${
    lead.contactName ? `\nContact: ${lead.contactName}` : ""
  }

Our business: ${business.businessName}, sender ${business.senderName} <${business.senderEmail}>, address: ${business.address}

Our product range (sample, do not list all — mention 1-2 relevant categories):
${productList}

Goal: introduce ourselves as a reliable supplier for their regular dental product/material needs, invite them to share what they currently buy and volumes, so we can send tailored pricing. Include this exact opt-out line verbatim at the end of the body: "${OPT_OUT_NOTE}"`;

  const raw = await completeText(system, user);
  return parseJsonEmail(raw);
}

export async function composeNegotiationReply(
  lead: LeadLike,
  inboundReplyText: string,
  negotiation: NegotiationResult,
  productName: string,
  currency: string,
  business: BusinessInfo
): Promise<DraftEmail> {
  const system = `You write short, professional B2B email replies negotiating price for dental product orders. Tone: warm, direct, confident but flexible. Never mention "floor price" or internal cost reasoning to the buyer. Output ONLY valid JSON: {"subject": string, "body": string}. Plain text body, under 150 words, ending with the sender's name and business name.`;

  const decisionInstruction =
    negotiation.decision === "accept"
      ? `We are ACCEPTING their price of ${currency} ${negotiation.recommendedUnitPrice} per unit for qty ${negotiation.quantity}. Confirm the deal warmly and ask for the go-ahead / PO details.`
      : negotiation.decision === "counter"
        ? `We are COUNTER-OFFERING at ${currency} ${negotiation.recommendedUnitPrice} per unit for qty ${negotiation.quantity}. Justify briefly (e.g. volume, quality, reliable supply) and invite them to confirm or continue discussing.`
        : `We are sending an OPENING QUOTE of ${currency} ${negotiation.recommendedUnitPrice} per unit for qty ${negotiation.quantity}, since they haven't proposed a price yet.`;

  const user = `Buyer: ${lead.name} (${lead.country})
Their message to us:
"""
${inboundReplyText}
"""

Product under discussion: ${productName}
${decisionInstruction}

Our business: ${business.businessName}, sender ${business.senderName} <${business.senderEmail}>`;

  const raw = await completeText(system, user);
  return parseJsonEmail(raw);
}

function parseJsonEmail(raw: string): DraftEmail {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`LLM did not return JSON email:\n${raw}`);
  const parsed = JSON.parse(jsonMatch[0]) as Partial<DraftEmail>;
  if (!parsed.subject || !parsed.body) throw new Error(`LLM JSON missing subject/body:\n${raw}`);
  return { subject: parsed.subject, body: parsed.body };
}
