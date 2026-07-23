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
  status TEXT NOT NULL DEFAULT 'new',  -- new | contacted | awaiting_pricing | won | lost | do_not_contact
  discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, country)
);

-- Replies logged from the client (pasted in manually after you see them in Outlook).
-- The agent does not price or respond to these automatically — see suggest-price for
-- an optional, read-only pricing suggestion you can use yourself.
CREATE TABLE IF NOT EXISTS replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  body TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Log of outreach emails the agent has composed and (attempted to) send.
CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  type TEXT NOT NULL DEFAULT 'outreach',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',  -- sent | failed | drafted (drafted = --dry-run, not actually sent)
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
