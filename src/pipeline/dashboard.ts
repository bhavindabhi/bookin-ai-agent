import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client.js";
import { listDrafts } from "./reviewDrafts.js";
import { listLeads } from "./leads.js";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generateDashboard(outPath = "dashboard.html"): string {
  const pending = listDrafts("pending_review");
  const approved = listDrafts("approved");
  const leads = listLeads();

  const counts = db
    .prepare(`SELECT status, COUNT(*) as n FROM leads GROUP BY status`)
    .all() as Array<{ status: string; n: number }>;

  const draftCard = (d: (typeof pending)[number]) => `
    <div class="card">
      <div class="card-head">
        <span class="badge ${d.type}">${esc(d.type)}</span>
        <strong>${esc(d.lead_name)}</strong>
        <span class="muted">${esc(d.contact_email ?? "no email on file")}</span>
      </div>
      <div class="subject">${esc(d.subject)}</div>
      <pre class="body">${esc(d.body)}</pre>
      <div class="meta">
        <span class="muted">draft #${d.id} &middot; ${esc(d.created_at)}</span>
        <button onclick="copyBody(${d.id})">Copy body</button>
      </div>
      <textarea id="body-${d.id}" hidden>${esc(d.body)}</textarea>
    </div>`;

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
  .card-head { display: flex; gap: .5rem; align-items: baseline; margin-bottom: .5rem; }
  .badge { font-size: .7rem; text-transform: uppercase; padding: .15rem .5rem; border-radius: 4px; background: #333; color: #fff; }
  .badge.outreach { background: #2563eb; }
  .badge.negotiation_reply { background: #b45309; }
  .subject { font-weight: 600; margin-bottom: .3rem; }
  .body { white-space: pre-wrap; font-family: inherit; background: #fafafa; padding: .7rem; border-radius: 6px; }
  .meta { display: flex; justify-content: space-between; align-items: center; margin-top: .5rem; }
  .muted { color: #777; font-size: .85rem; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  td, th { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid #eee; }
  .status { padding: .1rem .5rem; border-radius: 4px; background: #eee; }
  button { cursor: pointer; }
  .note { background: #fff8e1; border: 1px solid #f0d878; padding: .7rem 1rem; border-radius: 6px; font-size: .9rem; }
</style>
</head><body>
<h1>Dental Supply Outreach Agent</h1>
<p class="note">All emails below are <strong>drafts only</strong>. Nothing is sent automatically. Copy each into a new Outlook message, review it, and send it yourself.</p>
<div class="summary">
  ${counts.map((c) => `<span class="pill">${esc(c.status)}: ${c.n}</span>`).join("")}
</div>

<h2>Pending review (${pending.length})</h2>
${pending.length ? pending.map(draftCard).join("") : "<p class='muted'>No drafts waiting for review.</p>"}

<h2>Approved, ready to send (${approved.length})</h2>
${approved.length ? approved.map(draftCard).join("") : "<p class='muted'>Nothing approved yet.</p>"}

<h2>Leads (${leads.length})</h2>
<table>
<tr><th>ID</th><th>Name</th><th>Category</th><th>Country</th><th>Email</th><th>Status</th></tr>
${leads.map(leadRow).join("")}
</table>

<script>
function copyBody(id) {
  const el = document.getElementById('body-' + id);
  el.hidden = false;
  el.select();
  document.execCommand('copy');
  el.hidden = true;
}
</script>
</body></html>`;

  fs.writeFileSync(path.resolve(outPath), html, "utf-8");
  return path.resolve(outPath);
}
