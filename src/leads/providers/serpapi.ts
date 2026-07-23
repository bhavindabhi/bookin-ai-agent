import type { DiscoveredLead, DiscoveryQuery, LeadProvider } from "../types.js";

/**
 * Uses SerpAPI (https://serpapi.com) to run Google searches for businesses
 * matching the category + region, then extracts organic results as leads.
 * This is a *discovery* aid, not a verified contact database — always
 * spot-check contact emails before drafting outreach (see README).
 */
export const serpApiProvider: LeadProvider = {
  name: "serpapi",
  async discover(query: DiscoveryQuery): Promise<DiscoveredLead[]> {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) throw new Error("SERPAPI_KEY is not set");

    const q = encodeURIComponent(`${query.category} in ${query.region} email contact`);
    const url = `https://serpapi.com/search.json?q=${q}&num=${query.limit ?? 10}&api_key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`SerpAPI request failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as {
      organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
    };

    const results = data.organic_results ?? [];
    return results.slice(0, query.limit ?? results.length).map((r) => {
      const emailMatch = r.snippet?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return {
        name: r.title ?? "Unknown business",
        category: query.category,
        country: query.region,
        contactEmail: emailMatch?.[0],
        website: r.link,
        sourceUrl: r.link,
        notes: r.snippet,
      } satisfies DiscoveredLead;
    });
  },
};
