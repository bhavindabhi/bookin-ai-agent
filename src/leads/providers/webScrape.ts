import type { DiscoveredLead, DiscoveryQuery, LeadProvider } from "../types.js";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UA = "Mozilla/5.0 (compatible; DentalOutreachAgent/1.0)";

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: controller.signal });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeDdgUrl(href: string): string | null {
  try {
    const u = new URL(href, "https://duckduckgo.com");
    const target = u.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : href.startsWith("http") ? href : null;
  } catch {
    return null;
  }
}

function extractSearchResults(html: string, limit: number): Array<{ title: string; url: string }> {
  const results: Array<{ title: string; url: string }> = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && results.length < limit) {
    const url = decodeDdgUrl(m[1]);
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    if (url) results.push({ title: title || url, url });
  }
  return results;
}

/**
 * Free, no-API-key lead discovery: runs a DuckDuckGo HTML search for the
 * category + region, then fetches each result page and regex-scans it for
 * an email address. This is the default provider — noisier than a paid
 * business-data API, so always spot-check a lead before relying on it.
 */
export const webScrapeProvider: LeadProvider = {
  name: "web-scrape",
  async discover(query: DiscoveryQuery): Promise<DiscoveredLead[]> {
    const limit = query.limit ?? 10;
    const q = encodeURIComponent(`${query.category} ${query.region} contact email`);
    const html = await fetchText(`https://html.duckduckgo.com/html/?q=${q}`);
    const results = extractSearchResults(html, limit);

    const leads: DiscoveredLead[] = [];
    for (const r of results) {
      let email: string | undefined;
      try {
        const pageHtml = await fetchText(r.url);
        email = pageHtml.match(EMAIL_RE)?.[0];
      } catch {
        // page fetch failed — still record the lead, just without an email
      }
      leads.push({
        name: r.title,
        category: query.category,
        country: query.region,
        contactEmail: email,
        website: r.url,
        sourceUrl: r.url,
        notes: email ? undefined : "No email found automatically — check the site before outreach.",
      });
    }
    return leads;
  },
};
