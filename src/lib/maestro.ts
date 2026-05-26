import { getSDK } from './sdk';
import type { ComparisonMode } from '../types/workspace';

export interface StartComparisonInput {
  workspaceId: string;
  bucketName: string;
  docAKey: string;
  docBKey: string;
  mode: ComparisonMode;
  templateId: string;
  templateSystemMessage: string;
  linkedGuidelineIds: string[];
  includeVersionHistory: boolean;
  comparisonId: string;
}

// Orchestrator folder ID for Shared/ContractComparisonSolution (deployed via uip solution deploy)
const CONTRACT_COMPARISON_FOLDER_ID = 7890336;

export async function startComparison(input: StartComparisonInput): Promise<void> {
  const sdk = await getSDK();
  await sdk.processes.start(
    { processName: 'ContractComparisonProcess', inputArguments: JSON.stringify(input) },
    CONTRACT_COMPARISON_FOLDER_ID
  );
}
