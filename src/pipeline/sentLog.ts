import { db } from "../db/client.js";

export interface SentLogRow {
  id: number;
  lead_id: number;
  lead_name: string;
  contact_email: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export function listSentLog(status?: string): SentLogRow[] {
  if (status) {
    return db
      .prepare(
        `SELECT d.id, d.lead_id, l.name as lead_name, l.contact_email, d.subject, d.body, d.status, d.created_at
         FROM drafts d JOIN leads l ON l.id = d.lead_id
         WHERE d.status = ?
         ORDER BY d.created_at DESC`
      )
      .all(status) as SentLogRow[];
  }
  return db
    .prepare(
      `SELECT d.id, d.lead_id, l.name as lead_name, l.contact_email, d.subject, d.body, d.status, d.created_at
       FROM drafts d JOIN leads l ON l.id = d.lead_id
       ORDER BY d.created_at DESC`
    )
    .all() as SentLogRow[];
}
