import { db } from "../db/client.js";
import { loadPricebook } from "../pricing/pricebook.js";
import { loadBusinessInfo } from "../config/business.js";
import { composeOutreachEmail } from "../outreach/emailComposer.js";

interface LeadRow {
  id: number;
  name: string;
  category: string;
  country: string;
  contact_name: string | null;
  contact_email: string | null;
}

const insertDraft = db.prepare(`
  INSERT INTO drafts (lead_id, type, subject, body, status)
  VALUES (@lead_id, 'outreach', @subject, @body, 'pending_review')
`);

export async function draftOutreachForNewLeads(): Promise<{ drafted: number; skipped: number }> {
  const pricebook = loadPricebook();
  const business = loadBusinessInfo();

  const newLeads = db
    .prepare(
      `SELECT id, name, category, country, contact_name, contact_email
       FROM leads
       WHERE status = 'new'
         AND id NOT IN (SELECT lead_id FROM drafts WHERE type = 'outreach')`
    )
    .all() as LeadRow[];

  let drafted = 0;
  let skipped = 0;

  for (const lead of newLeads) {
    if (!lead.contact_email) {
      skipped++;
      continue;
    }
    const email = await composeOutreachEmail(
      { name: lead.name, category: lead.category, country: lead.country, contactName: lead.contact_name },
      pricebook,
      business
    );
    insertDraft.run({ lead_id: lead.id, subject: email.subject, body: email.body });
    drafted++;
  }

  return { drafted, skipped };
}
