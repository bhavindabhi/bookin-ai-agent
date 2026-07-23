CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,          -- e.g. "dental clinic", "dental lab", "distributor"
  country TEXT NOT NULL,
  region_query TEXT,               -- the search query/region that surfaced this lead
  contact_email TEXT,
  contact_name TEXT,
  website TEXT,
  source_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',  -- new | contacted | negotiating | won | lost | do_not_contact
  discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, country)
);

CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  type TEXT NOT NULL,              -- outreach | negotiation_reply
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',  -- pending_review | approved | sent | rejected
  meta_json TEXT,                  -- e.g. computed offer details for negotiation drafts
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  product_sku TEXT NOT NULL,
  quantity INTEGER,
  proposed_unit_price REAL,
  status TEXT NOT NULL DEFAULT 'open',  -- open | won | lost
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
