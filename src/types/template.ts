export type TemplateStatus = 'active' | 'draft';
export type GuidelineStatus = 'indexing' | 'indexed' | 'error';
export type TemplateMode = 'buyer-seller' | 'compliance';

export interface Template {
  id: string;
  name: string;
  description: string;
  bucketKey: string;
  systemMessage: string;
  linkedGuidelineIds: string[];
  comparisonMode: TemplateMode;
  status: TemplateStatus;
}

export interface Guideline {
  id: string;
  name: string;
  description: string;
  bucketKey: string;
  chunkCount: number;
  indexingStatus: GuidelineStatus;
  linkedTemplateIds: string[];
  uploadedAt: string;
}
