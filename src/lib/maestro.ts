import { getSDK } from './sdk';
import type { ComparisonMode } from '../types/workspace';

export interface StartComparisonInput {
  workspaceId: string;
  bucketName: string;
  docAKey: string;
  docBKey: string;
  mode: ComparisonMode;
  templateId: string;
  includeVersionHistory: boolean;
  comparisonId: string;
}

export async function startComparison(input: StartComparisonInput): Promise<void> {
  const sdk = await getSDK();
  await sdk.MaestroProcesses.start({
    processName: 'ContractComparisonProcess',
    inputArguments: input,
  });
}
