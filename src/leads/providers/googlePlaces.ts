import type { DiscoveredLead, DiscoveryQuery, LeadProvider } from "../types.js";

/**
 * Uses the Google Places API (Text Search + Place Details) to find real
 * businesses (dental clinics, labs, distributors) in a region. Places API
 * gives verified business names/websites/phone but rarely email — pair with
 * a website check before drafting outreach.
 */
export const googlePlacesProvider: LeadProvider = {
  name: "google-places",
  async discover(query: DiscoveryQuery): Promise<DiscoveredLead[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

    const textQuery = `${query.category} in ${query.region}`;
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.websiteUri,places.formattedAddress,places.internationalPhoneNumber",
      },
      body: JSON.stringify({ textQuery, pageSize: query.limit ?? 10 }),
    });

    if (!res.ok) {
      throw new Error(`Google Places request failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        websiteUri?: string;
        formattedAddress?: string;
        internationalPhoneNumber?: string;
      }>;
    };

    const places = data.places ?? [];
    return places.map((p) => ({
      name: p.displayName?.text ?? "Unknown business",
      category: query.category,
      country: query.region,
      website: p.websiteUri,
      sourceUrl: p.websiteUri,
      notes: [p.formattedAddress, p.internationalPhoneNumber].filter(Boolean).join(" | "),
    } satisfies DiscoveredLead));
  },
};
