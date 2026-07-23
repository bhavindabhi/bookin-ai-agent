import type { Product } from "./pricebook.js";

export type NegotiationDecision = "quote" | "accept" | "counter";

export interface NegotiationResult {
  decision: NegotiationDecision;
  recommendedUnitPrice: number;
  floorPrice: number;
  quantity: number;
  rationale: string;
}

function bestTierPrice(product: Product, quantity: number): number {
  const applicable = product.volumeTiers
    .filter((t) => quantity >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];
  return applicable ? applicable.unitPrice : product.listPrice;
}

/**
 * Pure rule-based negotiation. Never returns a price below `floorPrice`.
 * This never sends anything itself — callers always wrap the result in a
 * draft that a human reviews and approves (see pipeline/processReply.ts).
 */
export function evaluateOffer(
  product: Product,
  quantity: number,
  requestedUnitPrice?: number
): NegotiationResult {
  const tierPrice = bestTierPrice(product, quantity);

  if (requestedUnitPrice == null) {
    return {
      decision: "quote",
      recommendedUnitPrice: tierPrice,
      floorPrice: product.floorPrice,
      quantity,
      rationale: `No price requested yet — opening quote based on the volume tier for qty ${quantity}.`,
    };
  }

  if (requestedUnitPrice >= tierPrice) {
    return {
      decision: "accept",
      recommendedUnitPrice: requestedUnitPrice,
      floorPrice: product.floorPrice,
      quantity,
      rationale: `Buyer's offer (${requestedUnitPrice}) meets or beats our tier price (${tierPrice}) for qty ${quantity} — recommend accepting.`,
    };
  }

  if (requestedUnitPrice >= product.floorPrice) {
    return {
      decision: "counter",
      recommendedUnitPrice: tierPrice,
      floorPrice: product.floorPrice,
      quantity,
      rationale: `Buyer's offer (${requestedUnitPrice}) is above floor (${product.floorPrice}) but below our tier price (${tierPrice}) — counter at tier price; floor is available as a fallback if they push back.`,
    };
  }

  return {
    decision: "counter",
    recommendedUnitPrice: product.floorPrice,
    floorPrice: product.floorPrice,
    quantity,
    rationale: `Buyer's offer (${requestedUnitPrice}) is below our floor (${product.floorPrice}) — counter at floor as the final offer. If rejected, this deal falls outside acceptable margin.`,
  };
}
