import { db } from "../db/client.js";
import type { DiscoveredLead, DiscoveryQuery, LeadProvider } from "./types.js";
import { mockProvider } from "./providers/mock.js";
import { serpApiProvider } from "./providers/serpapi.js";
import { googlePlacesProvider } from "./providers/googlePlaces.js";

function selectProvider(): LeadProvider {
  if (process.env.GOOGLE_PLACES_API_KEY) return googlePlacesProvider;
  if (process.env.SERPAPI_KEY) return serpApiProvider;
  return mockProvider;
}

const insertLead = db.prepare(`
  INSERT INTO leads (name, category, country, region_query, contact_email, contact_name, website, source_url, notes)
  VALUES (@name, @category, @country, @region_query, @contact_email, @contact_name, @website, @source_url, @notes)
  ON CONFLICT(name, country) DO UPDATE SET
    contact_email = COALESCE(excluded.contact_email, leads.contact_email),
    website = COALESCE(excluded.website, leads.website),
    notes = COALESCE(excluded.notes, leads.notes)
`);

export async function discoverAndStoreLeads(query: DiscoveryQuery): Promise<{
  provider: string;
  found: number;
  leads: DiscoveredLead[];
}> {
  const provider = selectProvider();
  const leads = await provider.discover(query);

  const insertMany = db.transaction((rows: DiscoveredLead[]) => {
    for (const lead of rows) {
      insertLead.run({
        name: lead.name,
        category: lead.category,
        country: lead.country,
        region_query: query.region,
        contact_email: lead.contactEmail ?? null,
        contact_name: lead.contactName ?? null,
        website: lead.website ?? null,
        source_url: lead.sourceUrl ?? null,
        notes: lead.notes ?? null,
      });
    }
  });
  insertMany(leads);

  return { provider: provider.name, found: leads.length, leads };
}
