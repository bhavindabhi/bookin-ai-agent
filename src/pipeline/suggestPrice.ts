import { db } from "../db/client.js";
import { loadPricebook, findProduct } from "../pricing/pricebook.js";
import { evaluateOffer, type NegotiationResult } from "../pricing/negotiationEngine.js";
import { parseReplyForOffer } from "../outreach/replyParser.js";

/**
 * Read-only helper: prints a suggested price for a lead, within your
 * pricebook's floor/tiers. Never sends anything, never stores an email —
 * just a number you can use yourself when you reply with pricing.
 */
export async function suggestPriceForLead(
  leadId: number,
  overrides: { sku?: string; quantity?: number; offer?: number } = {}
): Promise<{ currency: string; product: string } & NegotiationResult> {
  const pricebook = loadPricebook();
  let sku = overrides.sku;
  let quantity = overrides.quantity;
  let requestedUnitPrice = overrides.offer;

  // Only fall back to LLM-parsing the logged reply if the caller didn't
  // already give us everything explicitly (keeps this usable with zero
  // ANTHROPIC_API_KEY when you just want a quick floor/tier calculation).
  if (!sku || quantity == null || requestedUnitPrice == null) {
    const latestReply = db
      .prepare(`SELECT body FROM replies WHERE lead_id = ? ORDER BY received_at DESC LIMIT 1`)
      .get(leadId) as unknown as { body: string } | undefined;

    if (latestReply) {
      const parsed = await parseReplyForOffer(latestReply.body, pricebook);
      sku ??= parsed.sku ?? undefined;
      quantity ??= parsed.quantity ?? undefined;
      requestedUnitPrice ??= parsed.requestedUnitPrice ?? undefined;
    } else if (!sku) {
      throw new Error(
        `No logged reply for lead ${leadId} and no --sku given. Run log-reply first, or pass --sku/--qty/--offer directly.`
      );
    }
  }

  if (!sku) throw new Error("Could not determine product SKU — pass --sku explicitly.");
  const product = findProduct(pricebook, sku);
  if (!product) throw new Error(`Unknown SKU: ${sku}`);

  const result = evaluateOffer(product, quantity ?? 1, requestedUnitPrice);
  return { currency: pricebook.currency, product: product.name, ...result };
}
