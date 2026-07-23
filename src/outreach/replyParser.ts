import { completeText } from "../llm/client.js";
import type { Pricebook } from "../pricing/pricebook.js";

export interface ParsedOffer {
  sku: string | null;
  quantity: number | null;
  requestedUnitPrice: number | null;
}

/**
 * Extracts a structured offer (which product, quantity, requested price)
 * from a buyer's free-text reply, so the negotiation engine can evaluate it.
 * Falls back to nulls when the reply doesn't contain enough info — the
 * caller should then draft a clarifying question instead of a price.
 */
export async function parseReplyForOffer(replyText: string, pricebook: Pricebook): Promise<ParsedOffer> {
  const skuList = pricebook.products.map((p) => `${p.sku}: ${p.name}`).join("\n");

  const system = `Extract a structured purchase offer from a buyer's email reply. Match the product to one of the given SKUs if mentioned or clearly implied; otherwise null. Output ONLY valid JSON: {"sku": string|null, "quantity": number|null, "requestedUnitPrice": number|null}. requestedUnitPrice is per-unit, not total. If the buyer gives a total price and a quantity, compute the per-unit price.`;

  const user = `Known products:\n${skuList}\n\nBuyer reply:\n"""\n${replyText}\n"""`;

  const raw = await completeText(system, user);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { sku: null, quantity: null, requestedUnitPrice: null };

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedOffer>;
  return {
    sku: parsed.sku ?? null,
    quantity: parsed.quantity ?? null,
    requestedUnitPrice: parsed.requestedUnitPrice ?? null,
  };
}
