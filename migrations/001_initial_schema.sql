-- GAGO CAMPAIGN OS — Migración 001: Esquema base
-- Prof. Manuel GAGO FERNÁNDEZ

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'editor', 'reviewer', 'reader')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  description TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  problem_solved TEXT NOT NULL DEFAULT '',
  value_proposition TEXT NOT NULL DEFAULT '',
  destination_url TEXT NOT NULL DEFAULT '',
  price_minor_units BIGINT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  responsible TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'archived', 'draft')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_status ON products(organization_id, status);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('visibility', 'traffic', 'leads', 'sales', 'other')),
  description TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'undetermined' CHECK (channel IN ('chatgpt_ads', 'other', 'undetermined')),
  territories TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'es',
  start_date DATE,
  end_date DATE,
  timezone TEXT NOT NULL DEFAULT 'Europe/Madrid',
  budget_minor_units BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  responsible TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  internal_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (internal_status IN ('draft', 'in_review', 'changes_requested', 'approved', 'archived')),
  external_status TEXT NOT NULL DEFAULT 'not_registered'
    CHECK (external_status IN ('not_registered', 'ready_to_transfer', 'created_externally', 'paused', 'publishing', 'finished')),
  external_status_declared_by UUID REFERENCES users(id),
  external_status_declared_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_product ON campaigns(product_id);
CREATE INDEX idx_campaigns_status ON campaigns(organization_id, internal_status);

-- Campaign versions (snapshot history)
CREATE TABLE campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, version)
);

-- Creatives (ads)
CREATE TABLE creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  destination_url TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'es',
  image_ref TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_creatives_org ON creatives(organization_id);
CREATE INDEX idx_creatives_campaign ON creatives(campaign_id);

-- Creative versions
CREATE TABLE creative_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  destination_url TEXT NOT NULL DEFAULT '',
  image_ref TEXT NOT NULL DEFAULT '',
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(creative_id, version_number)
);

-- Evidence records
CREATE TABLE evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('study', 'testimonial', 'data', 'certification', 'other')),
  reference TEXT NOT NULL DEFAULT '',
  date DATE,
  excerpt TEXT NOT NULL DEFAULT '',
  responsible TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected', 'expired')),
  limitations TEXT NOT NULL DEFAULT '',
  expiry_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evidence_org ON evidence_records(organization_id);
CREATE INDEX idx_evidence_status ON evidence_records(organization_id, status);

-- Evidence links (many-to-many)
CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('product', 'campaign', 'creative')),
  resource_id UUID NOT NULL,
  UNIQUE(evidence_id, resource_type, resource_id)
);
CREATE INDEX idx_evidence_links_resource ON evidence_links(resource_type, resource_id);

-- Review requests
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  snapshot_hash TEXT NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL
);
CREATE INDEX idx_review_requests_org ON review_requests(organization_id);
CREATE INDEX idx_review_requests_status ON review_requests(organization_id, status);

-- Review decisions
CREATE TABLE review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested', 'rejected')),
  comment TEXT NOT NULL DEFAULT '',
  decided_by UUID NOT NULL REFERENCES users(id),
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_decisions_request ON review_decisions(review_request_id);

-- Metric imports
CREATE TABLE metric_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  imported_by UUID NOT NULL REFERENCES users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rows_accepted INTEGER NOT NULL DEFAULT 0,
  rows_rejected INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  format_version TEXT NOT NULL DEFAULT '1.0'
);
CREATE INDEX idx_metric_imports_org ON metric_imports(organization_id);

-- Metric rows
CREATE TABLE metric_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES metric_imports(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  campaign_reference TEXT NOT NULL,
  date DATE NOT NULL,
  currency TEXT NOT NULL,
  spend_minor_units BIGINT NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  conversions NUMERIC(15,4) NOT NULL DEFAULT 0,
  revenue_minor_units BIGINT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_metric_rows_org ON metric_rows(organization_id);
CREATE INDEX idx_metric_rows_campaign ON metric_rows(campaign_id);
CREATE INDEX idx_metric_rows_date ON metric_rows(organization_id, date);

-- Audit events
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_events_org ON audit_events(organization_id);
CREATE INDEX idx_audit_events_time ON audit_events(organization_id, created_at DESC);

-- Organization settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'null',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Login attempt tracking (for rate limiting in serverless)
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
