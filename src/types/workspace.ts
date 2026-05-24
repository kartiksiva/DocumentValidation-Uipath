export type ComparisonMode = 'buyer-seller-diff' | 'template-compliance';
export type ComparisonStatus = 'running' | 'awaiting-review' | 'confirmed' | 'rejected';

export interface WorkspaceVersion {
  versionNumber: number;
  bucketKey: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSizeBytes: number;
}

export interface WorkspaceComparison {
  comparisonId: string;
  docAVersion: number;
  docBVersion: number;
  mode: ComparisonMode;
  templateId: string;
  includeVersionHistory: boolean;
  status: ComparisonStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectionNote?: string;
  startedAt: string;
  findingSummary?: {
    high: number;
    medium: number;
    aligned: number;
    missing: number;
    modified: number;
    extra: number;
  };
}

export interface ContractWorkspace {
  id: string;
  name: string;
  description: string;
  defaultTemplateId: string;
  buyerParty: string;
  sellerParty: string;
  contractType: string;
  ownerId: string;
  createdAt: string;
  versions: WorkspaceVersion[];
  comparisons: WorkspaceComparison[];
}
