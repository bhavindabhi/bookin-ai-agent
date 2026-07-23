import "dotenv/config";
import fs from "node:fs";
import { discoverAndStoreLeads } from "./leads/discovery.js";
import { sendOutreachToNewLeads } from "./pipeline/outreach.js";
import { sendTestEmail } from "./email/graphSender.js";
import { logReply } from "./pipeline/logReply.js";
import { suggestPriceForLead } from "./pipeline/suggestPrice.js";
import { listLeads, closeDeal, markLeadDoNotContact } from "./pipeline/leads.js";
import { listSentLog } from "./pipeline/sentLog.js";
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
      if (!region) throw new Error("Usage: discover --region <country/region> [--category <text>] [--limit <n>] [--provider mock|web-scrape|serpapi|google-places]");
      const limit = arg("--limit") ? Number(arg("--limit")) : undefined;
      const result = await discoverAndStoreLeads({ category, region, limit }, arg("--provider"));
      console.log(`[${result.provider}] found ${result.found} lead(s) for "${category}" in "${region}"`);
      for (const l of result.leads) console.log(`  - ${l.name} <${l.contactEmail ?? "no email found"}>`);
      break;
    }

    case "test-send": {
      console.log("Sending a test email to yourself via Microsoft Graph...");
      const result = await sendTestEmail();
      if (result.ok) {
        console.log(`Sent. Check the inbox (and Sent Items) for ${process.env.EMAIL_USER}.`);
      } else {
        console.error(`Failed: ${result.error}`);
        process.exitCode = 1;
      }
      break;
    }

    case "outreach": {
      const dryRun = hasFlag("--dry-run");
      const limit = arg("--limit") ? Number(arg("--limit")) : undefined;
      const delayMs = arg("--delay-ms") ? Number(arg("--delay-ms")) : undefined;
      console.log(dryRun ? "Dry run — composing but not sending." : "Sending outreach emails via your configured Outlook account...");
      const result = await sendOutreachToNewLeads({ dryRun, limit, delayMs });
      console.log(
        `Attempted ${result.attempted}. Sent ${result.sent}. Drafted (dry-run) ${result.drafted}. Failed ${result.failed}. ` +
          `Skipped ${result.skippedNoEmail} lead(s) with no contact email.`
      );
      break;
    }

    case "log-reply": {
      const leadId = arg("--lead-id");
      const file = arg("--file");
      const text = arg("--text");
      if (!leadId || (!file && !text)) {
        throw new Error('Usage: log-reply --lead-id <id> (--file <path> | --text "...")');
      }
      const replyText = file ? fs.readFileSync(file, "utf-8") : (text as string);
      logReply(Number(leadId), replyText);
      console.log(`Logged reply for lead ${leadId}. Status set to awaiting_pricing — go ahead and price it yourself.`);
      break;
    }

    case "suggest-price": {
      const leadId = arg("--lead-id");
      if (!leadId) throw new Error("Usage: suggest-price --lead-id <id> [--sku <SKU>] [--qty <n>] [--offer <price>]");
      const sku = arg("--sku");
      const qty = arg("--qty") ? Number(arg("--qty")) : undefined;
      const offer = arg("--offer") ? Number(arg("--offer")) : undefined;
      const result = await suggestPriceForLead(Number(leadId), { sku, quantity: qty, offer });
      console.log(`Product: ${result.product}`);
      console.log(`Decision: ${result.decision}`);
      console.log(`Suggested unit price: ${result.currency} ${result.recommendedUnitPrice} (floor: ${result.floorPrice}) for qty ${result.quantity}`);
      console.log(`Rationale: ${result.rationale}`);
      console.log("\nThis is a suggestion only — nothing was sent. Reply to the client yourself with your price.");
      break;
    }

    case "leads": {
      const status = arg("--status");
      for (const l of listLeads(status)) {
        console.log(`#${l.id} [${l.status}] ${l.name} (${l.category}, ${l.country}) <${l.contact_email ?? "no email"}>`);
      }
      break;
    }

    case "do-not-contact": {
      const leadId = arg("--lead-id");
      if (!leadId) throw new Error("Usage: do-not-contact --lead-id <id>");
      markLeadDoNotContact(Number(leadId));
      console.log(`Lead ${leadId} marked do_not_contact.`);
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

    case "sent-log": {
      const status = arg("--status");
      for (const d of listSentLog(status)) {
        console.log(`#${d.id} [${d.status}] -> ${d.lead_name} <${d.contact_email ?? "no email"}> :: ${d.subject}`);
      }
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
  discover --region "<country/region>" [--category "dental clinic"] [--limit 10] [--provider mock|web-scrape|serpapi|google-places]
  test-send                                             sends a test email to yourself via Microsoft Graph, to verify setup
  outreach [--dry-run] [--limit N] [--delay-ms N]      composes + actually sends via Microsoft Graph
  log-reply --lead-id <id> (--file reply.txt | --text "...")   record a client's reply, no auto response
  suggest-price --lead-id <id> [--sku <SKU>] [--qty <n>] [--offer <price>]   read-only pricing suggestion
  leads [--status new|contacted|awaiting_pricing|won|lost|do_not_contact]
  do-not-contact --lead-id <id>
  close-deal --lead-id <id> (--won | --lost)
  sent-log [--status sent|failed|drafted]
  dashboard [--out dashboard.html]
`);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
