CREATE TABLE contract_workspaces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  default_template_id TEXT NOT NULL DEFAULT '',
  buyer_party         TEXT NOT NULL DEFAULT '',
  seller_party        TEXT NOT NULL DEFAULT '',
  contract_type       TEXT NOT NULL DEFAULT '',
  owner_id            TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  versions            JSONB NOT NULL DEFAULT '[]',
  comparisons         JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE templates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  bucket_key           TEXT NOT NULL DEFAULT '',
  system_message       TEXT NOT NULL DEFAULT '',
  linked_guideline_ids JSONB NOT NULL DEFAULT '[]',
  comparison_mode      TEXT NOT NULL DEFAULT 'buyer-seller-diff',
  status               TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE guidelines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  bucket_key          TEXT NOT NULL DEFAULT '',
  chunk_count         INTEGER NOT NULL DEFAULT 0,
  indexing_status     TEXT NOT NULL DEFAULT 'indexing',
  linked_template_ids JSONB NOT NULL DEFAULT '[]',
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
