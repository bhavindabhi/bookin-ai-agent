import "dotenv/config";
import fs from "node:fs";
import { discoverAndStoreLeads } from "./leads/discovery.js";
import { draftOutreachForNewLeads } from "./pipeline/draftOutreach.js";
import { processReply } from "./pipeline/processReply.js";
import { listDrafts, approveDraft, rejectDraft, markDraftSent } from "./pipeline/reviewDrafts.js";
import { listLeads, closeDeal } from "./pipeline/leads.js";
import { generateDashboard } from "./pipeline/dashboard.js";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  const [, , command] = process.argv;

  switch (command) {
    case "discover": {
      const category = arg("--category") ?? "dental clinic";
      const region = arg("--region");
      if (!region) throw new Error("Usage: discover --region <country/region> [--category <text>] [--limit <n>]");
      const limit = arg("--limit") ? Number(arg("--limit")) : undefined;
      const result = await discoverAndStoreLeads({ category, region, limit });
      console.log(`[${result.provider}] found ${result.found} lead(s) for "${category}" in "${region}"`);
      for (const l of result.leads) console.log(`  - ${l.name} <${l.contactEmail ?? "no email"}>`);
      break;
    }

    case "draft-outreach": {
      const result = await draftOutreachForNewLeads();
      console.log(`Drafted ${result.drafted} outreach email(s). Skipped ${result.skipped} lead(s) with no contact email.`);
      break;
    }

    case "process-reply": {
      const leadId = arg("--lead-id");
      const file = arg("--file");
      const text = arg("--text");
      const sku = arg("--sku");
      if (!leadId || (!file && !text)) {
        throw new Error("Usage: process-reply --lead-id <id> (--file <path> | --text \"...\") [--sku <SKU>]");
      }
      const replyText = file ? fs.readFileSync(file, "utf-8") : (text as string);
      const result = await processReply({ leadId: Number(leadId), replyText, sku });
      console.log(`Negotiation decision: ${result.negotiation.decision} @ ${result.negotiation.recommendedUnitPrice} per unit`);
      console.log(`Draft created: "${result.draftSubject}"`);
      break;
    }

    case "review": {
      const status = arg("--status") ?? "pending_review";
      const drafts = listDrafts(status);
      if (!drafts.length) {
        console.log(`No drafts with status "${status}".`);
        break;
      }
      for (const d of drafts) {
        console.log(`\n#${d.id} [${d.type}] -> ${d.lead_name} <${d.contact_email ?? "no email"}>`);
        console.log(`Subject: ${d.subject}`);
        console.log(d.body);
        console.log("---");
      }
      break;
    }

    case "approve": {
      const id = arg("--draft-id");
      if (!id) throw new Error("Usage: approve --draft-id <id>");
      approveDraft(Number(id));
      console.log(`Draft ${id} approved.`);
      break;
    }

    case "reject": {
      const id = arg("--draft-id");
      if (!id) throw new Error("Usage: reject --draft-id <id>");
      rejectDraft(Number(id));
      console.log(`Draft ${id} rejected.`);
      break;
    }

    case "mark-sent": {
      const id = arg("--draft-id");
      if (!id) throw new Error("Usage: mark-sent --draft-id <id>  (run this after you've pasted it into Outlook and hit send)");
      markDraftSent(Number(id));
      console.log(`Draft ${id} marked sent.`);
      break;
    }

    case "leads": {
      const status = arg("--status");
      for (const l of listLeads(status)) {
        console.log(`#${l.id} [${l.status}] ${l.name} (${l.category}, ${l.country}) <${l.contact_email ?? "no email"}>`);
      }
      break;
    }

    case "close-deal": {
      const leadId = arg("--lead-id");
      const won = hasFlag("--won");
      const lost = hasFlag("--lost");
      if (!leadId || (!won && !lost)) throw new Error("Usage: close-deal --lead-id <id> (--won | --lost)");
      closeDeal(Number(leadId), won ? "won" : "lost");
      console.log(`Lead ${leadId} marked ${won ? "won" : "lost"}.`);
      break;
    }

    case "dashboard": {
      const out = generateDashboard(arg("--out") ?? "dashboard.html");
      console.log(`Dashboard written to ${out}`);
      break;
    }

    default:
      console.log(`Dental Supply Outreach Agent

Commands:
  discover --region "<country/region>" [--category "dental clinic"] [--limit 10]
  draft-outreach
  process-reply --lead-id <id> (--file reply.txt | --text "...") [--sku <SKU>]
  review [--status pending_review|approved|sent|rejected]
  approve --draft-id <id>
  reject --draft-id <id>
  mark-sent --draft-id <id>
  leads [--status new|contacted|negotiating|won|lost|do_not_contact]
  close-deal --lead-id <id> (--won | --lost)
  dashboard [--out dashboard.html]
`);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
