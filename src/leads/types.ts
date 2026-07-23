export interface DiscoveredLead {
  name: string;
  category: string;
  country: string;
  contactEmail?: string;
  contactName?: string;
  website?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface DiscoveryQuery {
  /** e.g. "dental clinic", "dental lab", "dental supply distributor" */
  category: string;
  /** country or region name, e.g. "United Kingdom", "United Arab Emirates" */
  region: string;
  limit?: number;
}

export interface LeadProvider {
  name: string;
  discover(query: DiscoveryQuery): Promise<DiscoveredLead[]>;
}
