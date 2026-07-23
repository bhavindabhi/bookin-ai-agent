import { db } from "../db/client.js";
import { loadPricebook, findProduct } from "../pricing/pricebook.js";
import { loadBusinessInfo } from "../config/business.js";
import { parseReplyForOffer } from "../outreach/replyParser.js";
import { evaluateOffer } from "../pricing/negotiationEngine.js";
import { composeNegotiationReply } from "../outreach/emailComposer.js";

interface LeadRow {
  id: number;
  name: string;
  category: string;
  country: string;
  contact_name: string | null;
}

const insertDraft = db.prepare(`
  INSERT INTO drafts (lead_id, type, subject, body, status, meta_json)
  VALUES (@lead_id, 'negotiation_reply', @subject, @body, 'pending_review', @meta_json)
`);

const upsertDeal = db.prepare(`
  INSERT INTO deals (lead_id, product_sku, quantity, proposed_unit_price, status, updated_at)
  VALUES (@lead_id, @product_sku, @quantity, @proposed_unit_price, 'open', datetime('now'))
`);

const setLeadStatus = db.prepare(`UPDATE leads SET status = @status WHERE id = @id`);

export interface ProcessReplyOptions {
  leadId: number;
  replyText: string;
  /** Force a specific SKU if the reply doesn't clearly name one. */
  sku?: string;
}

export async function processReply(options: ProcessReplyOptions) {
  const lead = db.prepare(`SELECT id, name, category, country, contact_name FROM leads WHERE id = ?`).get(
    options.leadId
  ) as LeadRow | undefined;
  if (!lead) throw new Error(`No lead with id ${options.leadId}`);

  const pricebook = loadPricebook();
  const business = loadBusinessInfo();

  const parsed = await parseReplyForOffer(options.replyText, pricebook);
  const sku = options.sku ?? parsed.sku;
  if (!sku) {
    throw new Error(
      "Could not determine which product this reply refers to. Re-run with --sku <SKU> to specify it."
    );
  }
  const product = findProduct(pricebook, sku);
  if (!product) throw new Error(`Unknown SKU: ${sku}`);

  const quantity = parsed.quantity ?? 1;
  const negotiation = evaluateOffer(product, quantity, parsed.requestedUnitPrice ?? undefined);

  const email = await composeNegotiationReply(
    { name: lead.name, category: lead.category, country: lead.country, contactName: lead.contact_name },
    options.replyText,
    negotiation,
    product.name,
    pricebook.currency,
    business
  );

  insertDraft.run({
    lead_id: lead.id,
    subject: email.subject,
    body: email.body,
    meta_json: JSON.stringify({ sku: product.sku, ...negotiation }),
  });

  upsertDeal.run({
    lead_id: lead.id,
    product_sku: product.sku,
    quantity,
    proposed_unit_price: negotiation.recommendedUnitPrice,
  });

  setLeadStatus.run({ id: lead.id, status: "negotiating" });

  return { negotiation, product, draftSubject: email.subject };
}
