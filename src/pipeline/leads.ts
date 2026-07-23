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
  db.prepare(`UPDATE deals SET status = ?, updated_at = datetime('now') WHERE lead_id = ? AND status = 'open'`).run(
    outcome,
    leadId
  );
}
