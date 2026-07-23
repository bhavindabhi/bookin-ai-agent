import { db } from "../db/client.js";

export interface DraftRow {
  id: number;
  lead_id: number;
  lead_name: string;
  contact_email: string | null;
  type: string;
  subject: string;
  body: string;
  status: string;
  meta_json: string | null;
  created_at: string;
}

export function listDrafts(status = "pending_review"): DraftRow[] {
  return db
    .prepare(
      `SELECT d.id, d.lead_id, l.name as lead_name, l.contact_email, d.type, d.subject, d.body, d.status, d.meta_json, d.created_at
       FROM drafts d JOIN leads l ON l.id = d.lead_id
       WHERE d.status = ?
       ORDER BY d.created_at DESC`
    )
    .all(status) as DraftRow[];
}

export function approveDraft(draftId: number) {
  const res = db
    .prepare(`UPDATE drafts SET status = 'approved', reviewed_at = datetime('now') WHERE id = ? AND status = 'pending_review'`)
    .run(draftId);
  if (res.changes === 0) throw new Error(`Draft ${draftId} not found or not pending review`);
}

export function rejectDraft(draftId: number) {
  const res = db
    .prepare(`UPDATE drafts SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ? AND status = 'pending_review'`)
    .run(draftId);
  if (res.changes === 0) throw new Error(`Draft ${draftId} not found or not pending review`);
}

/** Call this once you've actually pasted the draft into Outlook and hit send. */
export function markDraftSent(draftId: number) {
  const draft = db.prepare(`SELECT id, lead_id, type, status FROM drafts WHERE id = ?`).get(draftId) as
    | { id: number; lead_id: number; type: string; status: string }
    | undefined;
  if (!draft) throw new Error(`Draft ${draftId} not found`);
  if (draft.status !== "approved" && draft.status !== "pending_review") {
    throw new Error(`Draft ${draftId} has status ${draft.status}, expected approved/pending_review`);
  }

  db.prepare(`UPDATE drafts SET status = 'sent', reviewed_at = datetime('now') WHERE id = ?`).run(draftId);

  const newLeadStatus = draft.type === "outreach" ? "contacted" : "negotiating";
  db.prepare(`UPDATE leads SET status = ? WHERE id = ? AND status != 'won' AND status != 'lost'`).run(
    newLeadStatus,
    draft.lead_id
  );
}
