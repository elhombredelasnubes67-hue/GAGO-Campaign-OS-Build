// GAGO CAMPAIGN OS — Tipos de datos
// Prof. Manuel GAGO FERNÁNDEZ

export type UserRole = 'admin' | 'editor' | 'reviewer' | 'reader';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export type ProductType = 'product' | 'service';
export type ProductStatus = 'active' | 'archived' | 'draft';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  type: ProductType;
  description: string;
  targetAudience: string;
  problemSolved: string;
  valueProposition: string;
  destinationUrl: string;
  priceMinorUnits: number | null;
  currency: string;
  responsible: string;
  status: ProductStatus;
  tags: string[];
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CampaignObjective = 'visibility' | 'traffic' | 'leads' | 'sales' | 'other';
export type CampaignChannel = 'chatgpt_ads' | 'other' | 'undetermined';
export type CampaignInternalStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'archived';
export type CampaignExternalStatus = 'not_registered' | 'ready_to_transfer' | 'created_externally' | 'paused' | 'publishing' | 'finished';

export interface Campaign {
  id: string;
  organizationId: string;
  productId: string;
  name: string;
  objective: CampaignObjective;
  description: string;
  targetAudience: string;
  channel: CampaignChannel;
  territories: string;
  language: string;
  startDate: string;
  endDate: string;
  timezone: string;
  budgetMinorUnits: number;
  currency: string;
  responsible: string;
  notes: string;
  internalStatus: CampaignInternalStatus;
  externalStatus: CampaignExternalStatus;
  externalStatusDeclaredBy: string | null;
  externalStatusDeclaredAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Creative {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  headline: string;
  body: string;
  cta: string;
  destinationUrl: string;
  language: string;
  imageRef: string;
  imageAlt: string;
  notes: string;
  evidenceIds: string[];
  versionNumber: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreativeVersion {
  id: string;
  creativeId: string;
  versionNumber: number;
  headline: string;
  body: string;
  cta: string;
  destinationUrl: string;
  imageRef: string;
  changedAt: string;
  changedBy: string;
}

export type EvidenceType = 'study' | 'testimonial' | 'data' | 'certification' | 'other';
export type EvidenceStatus = 'pending' | 'reviewed' | 'rejected' | 'expired';

export interface Evidence {
  id: string;
  organizationId: string;
  title: string;
  claim: string;
  sourceType: EvidenceType;
  reference: string;
  date: string;
  excerpt: string;
  responsible: string;
  status: EvidenceStatus;
  limitations: string;
  expiryDate: string | null;
  linkedProducts: string[];
  linkedCampaigns: string[];
  linkedCreatives: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ReviewRequest {
  id: string;
  organizationId: string;
  campaignId: string;
  snapshotHash: string;
  snapshotData: Record<string, unknown>;
  status: 'pending' | 'approved' | 'changes_requested' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  version: number;
}

export interface ReviewDecision {
  id: string;
  reviewRequestId: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  comment: string;
  decidedBy: string;
  decidedAt: string;
}

export interface MetricImport {
  id: string;
  organizationId: string;
  fileName: string;
  fileHash: string;
  source: string;
  importedBy: string;
  importedAt: string;
  rowsAccepted: number;
  rowsRejected: number;
  errors: string[];
  formatVersion: string;
}

export interface MetricRow {
  id: string;
  importId: string;
  organizationId: string;
  campaignId: string;
  campaignReference: string;
  date: string;
  currency: string;
  spendMinorUnits: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueMinorUnits: number;
  source: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export interface AppState {
  user: User | null;
  organization: Organization;
  products: Product[];
  campaigns: Campaign[];
  creatives: Creative[];
  creativeVersions: CreativeVersion[];
  evidence: Evidence[];
  reviewRequests: ReviewRequest[];
  reviewDecisions: ReviewDecision[];
  metricImports: MetricImport[];
  metricRows: MetricRow[];
  auditEvents: AuditEvent[];
  demoMode: boolean;
}
