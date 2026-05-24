export type DeviationType = 'high-risk' | 'medium-risk' | 'aligned' | 'missing' | 'modified' | 'extra';
export type RagStatus = 'HIGH' | 'MEDIUM' | 'OK' | 'MISSING' | 'MODIFIED' | 'EXTRA';

export interface Finding {
  id: string;
  clauseRef: string;
  deviationType: DeviationType;
  snippetA: string;
  snippetB?: string;
  explanation: string;
  guidelineCitation?: string;
  insertAfterClause?: string;
}

export interface ScorecardCategory {
  name: string;
  status: RagStatus;
  summary: string;
}

export interface ReviewPayload {
  comparisonId: string;
  workspaceId: string;
  mode: string;
  scorecard: ScorecardCategory[];
  compliancePercent?: number;
  findings: Finding[];
  narrative: string;
  taskId: string;
}
