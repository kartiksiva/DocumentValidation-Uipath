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

export async function startComparison(input: StartComparisonInput, folderId = 0): Promise<void> {
  const sdk = await getSDK();
  await sdk.processes.start(
    { processName: 'ContractComparisonProcess', inputArguments: JSON.stringify(input) },
    folderId
  );
}
