import { db } from "../db/client.js";

export interface LeadSummary {
  id: number;
  name: string;
  category: string;
  country: string;
  contact_email: string | null;
  status: string;
  discovered_at: string;
}

export function listLeads(status?: string): LeadSummary[] {
  if (status) {
    return db
      .prepare(`SELECT id, name, category, country, contact_email, status, discovered_at FROM leads WHERE status = ? ORDER BY discovered_at DESC`)
      .all(status) as LeadSummary[];
  }
  return db
    .prepare(`SELECT id, name, category, country, contact_email, status, discovered_at FROM leads ORDER BY discovered_at DESC`)
    .all() as LeadSummary[];
}

export function markLeadDoNotContact(leadId: number) {
  db.prepare(`UPDATE leads SET status = 'do_not_contact' WHERE id = ?`).run(leadId);
}

export function closeDeal(leadId: number, outcome: "won" | "lost") {
  db.prepare(`UPDATE leads SET status = ? WHERE id = ?`).run(outcome, leadId);
}

export interface LeadWithLatestReply extends LeadSummary {
  latest_reply: string | null;
  reply_received_at: string | null;
}

export function listLeadsAwaitingPricing(): LeadWithLatestReply[] {
  return db
    .prepare(
      `SELECT l.id, l.name, l.category, l.country, l.contact_email, l.status, l.discovered_at,
              r.body as latest_reply, r.received_at as reply_received_at
       FROM leads l
       LEFT JOIN replies r ON r.id = (
         SELECT id FROM replies WHERE lead_id = l.id ORDER BY received_at DESC LIMIT 1
       )
       WHERE l.status = 'awaiting_pricing'
       ORDER BY r.received_at DESC`
    )
    .all() as LeadWithLatestReply[];
}
