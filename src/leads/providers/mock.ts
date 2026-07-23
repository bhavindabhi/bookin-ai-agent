import type { DiscoveredLead, DiscoveryQuery, LeadProvider } from "../types.js";

/**
 * Fallback provider used when no real search API key is configured.
 * Lets you exercise the full pipeline (discover -> draft -> negotiate -> track)
 * before wiring up SerpAPI/Google Places.
 */
export const mockProvider: LeadProvider = {
  name: "mock",
  async discover(query: DiscoveryQuery): Promise<DiscoveredLead[]> {
    const samples: DiscoveredLead[] = [
      {
        name: `${query.region} Dental Supplies Ltd`,
        category: query.category,
        country: query.region,
        contactEmail: "procurement@example-dentalsupplies.test",
        contactName: "Procurement Manager",
        website: "https://example-dentalsupplies.test",
        sourceUrl: "https://example-dentalsupplies.test/about",
        notes: "Sample lead from mock provider — replace with a real search API.",
      },
      {
        name: `${query.region} Smile Dental Clinic Group`,
        category: query.category,
        country: query.region,
        contactEmail: "orders@example-smileclinic.test",
        contactName: "Practice Manager",
        website: "https://example-smileclinic.test",
        sourceUrl: "https://example-smileclinic.test/contact",
        notes: "Sample lead from mock provider — replace with a real search API.",
      },
    ];
    return samples.slice(0, query.limit ?? samples.length);
  },
};
