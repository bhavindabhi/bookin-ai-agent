import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client.js";
import { listSentLog } from "./sentLog.js";
import { listLeads, listLeadsAwaitingPricing } from "./leads.js";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateDashboard(outPath = "dashboard.html"): string {
  const awaitingPricing = listLeadsAwaitingPricing();
  const recentLog = listSentLog().slice(0, 50);
  const leads = listLeads();

  const counts = db
    .prepare(`SELECT status, COUNT(*) as n FROM leads GROUP BY status`)
    .all() as Array<{ status: string; n: number }>;

  const pricingCard = (l: (typeof awaitingPricing)[number]) => `
    <div class="card">
      <div class="card-head">
        <strong>${esc(l.name)}</strong>
        <span class="muted">${esc(l.contact_email ?? "no email on file")} &middot; lead #${l.id}</span>
      </div>
      ${l.latest_reply ? `<pre class="body">${esc(l.latest_reply)}</pre>` : "<p class='muted'>No reply text logged.</p>"}
      <div class="meta"><span class="muted">received ${esc(l.reply_received_at ?? "")}</span></div>
    </div>`;

  const logRow = (d: (typeof recentLog)[number]) => `
    <tr>
      <td><span class="status ${esc(d.status)}">${esc(d.status)}</span></td>
      <td>${esc(d.lead_name)}</td>
      <td>${esc(d.contact_email ?? "-")}</td>
      <td>${esc(d.subject)}</td>
      <td class="muted">${esc(d.created_at)}</td>
    </tr>`;

  const leadRow = (l: (typeof leads)[number]) => `
    <tr>
      <td>${l.id}</td>
      <td>${esc(l.name)}</td>
      <td>${esc(l.category)}</td>
      <td>${esc(l.country)}</td>
      <td>${esc(l.contact_email ?? "-")}</td>
      <td><span class="status ${esc(l.status)}">${esc(l.status)}</span></td>
    </tr>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Dental Supply Outreach Agent</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 1px solid #ddd; padding-bottom: .3rem; }
  .summary { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
  .pill { background: #f0f0f0; border-radius: 999px; padding: .3rem .8rem; font-size: .85rem; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  .card-head { display: flex; gap: .5rem; align-items: baseline; margin-bottom: .5rem; justify-content: space-between; }
  .body { white-space: pre-wrap; font-family: inherit; background: #fafafa; padding: .7rem; border-radius: 6px; }
  .meta { display: flex; justify-content: space-between; align-items: center; margin-top: .5rem; }
  .muted { color: #777; font-size: .85rem; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  td, th { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid #eee; }
  .status { padding: .1rem .5rem; border-radius: 4px; background: #eee; }
  .status.sent { background: #dcfce7; }
  .status.failed { background: #fee2e2; }
  .status.awaiting_pricing { background: #fef3c7; }
  .note { background: #fff8e1; border: 1px solid #f0d878; padding: .7rem 1rem; border-radius: 6px; font-size: .9rem; }
</style>
</head><body>
<h1>Dental Supply Outreach Agent</h1>
<p class="note">Outreach emails are sent automatically via your configured Outlook account. Replies are logged, not answered automatically — pricing is on you.</p>
<div class="summary">
  ${counts.map((c) => `<span class="pill">${esc(c.status)}: ${c.n}</span>`).join("")}
</div>

<h2>Awaiting your price (${awaitingPricing.length})</h2>
${awaitingPricing.length ? awaitingPricing.map(pricingCard).join("") : "<p class='muted'>No leads waiting on pricing.</p>"}

<h2>Recent outreach log (${recentLog.length})</h2>
<table>
<tr><th>Status</th><th>Lead</th><th>Email</th><th>Subject</th><th>When</th></tr>
${recentLog.map(logRow).join("")}
</table>

<h2>Leads (${leads.length})</h2>
<table>
<tr><th>ID</th><th>Name</th><th>Category</th><th>Country</th><th>Email</th><th>Status</th></tr>
${leads.map(leadRow).join("")}
</table>

</body></html>`;

  fs.writeFileSync(path.resolve(outPath), html, "utf-8");
  return path.resolve(outPath);
}
