import { db } from "../db/client.js";

/**
 * Records a reply you received from a client (paste it in after you see it
 * in Outlook) and flags the lead as awaiting your pricing. The agent does
 * NOT price or respond automatically from here — that's on you. Use
 * suggest-price if you want a read-only pricing suggestion first.
 */
export function logReply(leadId: number, replyText: string): void {
  const lead = db.prepare(`SELECT id FROM leads WHERE id = ?`).get(leadId);
  if (!lead) throw new Error(`No lead with id ${leadId}`);

  db.prepare(`INSERT INTO replies (lead_id, body) VALUES (?, ?)`).run(leadId, replyText);
  db.prepare(`UPDATE leads SET status = 'awaiting_pricing' WHERE id = ? AND status NOT IN ('won', 'lost')`).run(
    leadId
  );
}
