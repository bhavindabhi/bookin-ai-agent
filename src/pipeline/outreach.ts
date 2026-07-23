import { db } from "../db/client.js";
import { loadBusinessInfo } from "../config/business.js";
import { composeOutreachEmail } from "../outreach/emailComposer.js";
import { sendEmail } from "../email/graphSender.js";
import { sleep } from "../utils/sleep.js";

interface LeadRow {
  id: number;
  name: string;
  category: string;
  country: string;
  contact_name: string | null;
  contact_email: string;
}

const insertLog = db.prepare(`
  INSERT INTO drafts (lead_id, type, subject, body, status)
  VALUES (@lead_id, 'outreach', @subject, @body, @status)
`);
const setLeadContacted = db.prepare(`UPDATE leads SET status = 'contacted' WHERE id = ?`);

export interface OutreachOptions {
  /** Preview + log what would be sent without actually emailing anyone. */
  dryRun?: boolean;
  /** Cap how many leads get emailed in this run. */
  limit?: number;
  /** Delay between sends, ms. Defaults to EMAIL_SEND_DELAY_MS or 4000. */
  delayMs?: number;
}

export interface OutreachSummary {
  attempted: number;
  sent: number;
  failed: number;
  drafted: number;
  skippedNoEmail: number;
}

/**
 * Sends the initial B2B outreach email to every lead with status 'new' and
 * a known contact email. This actually sends via your configured Outlook
 * SMTP account (see .env.example) unless dryRun is set.
 */
export async function sendOutreachToNewLeads(opts: OutreachOptions = {}): Promise<OutreachSummary> {
  const business = loadBusinessInfo();
  const delayMs = opts.delayMs ?? Number(process.env.EMAIL_SEND_DELAY_MS ?? 4000);

  const skippedNoEmail = (
    db.prepare(`SELECT COUNT(*) as n FROM leads WHERE status = 'new' AND contact_email IS NULL`).get() as {
      n: number;
    }
  ).n;

  const rows = db
    .prepare(
      `SELECT id, name, category, country, contact_name, contact_email
       FROM leads WHERE status = 'new' AND contact_email IS NOT NULL
       LIMIT ?`
    )
    .all(opts.limit ?? 1_000_000) as LeadRow[];

  let sent = 0;
  let failed = 0;
  let drafted = 0;

  for (const [i, lead] of rows.entries()) {
    const email = await composeOutreachEmail(
      { name: lead.name, category: lead.category, country: lead.country, contactName: lead.contact_name },
      business
    );

    if (opts.dryRun) {
      insertLog.run({ lead_id: lead.id, subject: email.subject, body: email.body, status: "drafted" });
      drafted++;
      continue;
    }

    const result = await sendEmail(lead.contact_email, email.subject, email.body);
    insertLog.run({
      lead_id: lead.id,
      subject: email.subject,
      body: email.body,
      status: result.ok ? "sent" : "failed",
    });

    if (result.ok) {
      setLeadContacted.run(lead.id);
      sent++;
    } else {
      failed++;
      console.error(`  failed to send to ${lead.contact_email}: ${result.error}`);
    }

    if (i < rows.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  return { attempted: rows.length, sent, failed, drafted, skippedNoEmail };
}
