import { getSDK } from './sdk';

const BUCKET_NAME = 'contract-ai';

type VersionKeyParams = { workspaceId: string; versionNumber: number; filename: string };
type ComparisonKeyParams = { workspaceId: string; comparisonId: string; artifact: string };
type TemplateKeyParams = { templateId: string; filename: string };
type GuidelineKeyParams = { guidelineId: string; filename: string };

export function buildBucketKey(
  params: VersionKeyParams | ComparisonKeyParams | TemplateKeyParams | GuidelineKeyParams
): string {
  if ('versionNumber' in params) {
    return `workspaces/${params.workspaceId}/versions/v${params.versionNumber}/${params.filename}`;
  }
  if ('comparisonId' in params) {
    return `workspaces/${params.workspaceId}/comparisons/${params.comparisonId}/${params.artifact}`;
  }
  if ('templateId' in params) {
    return `templates/${params.templateId}/${params.filename}`;
  }
  return `guidelines/${params.guidelineId}/${params.filename}`;
}

export async function uploadFile(key: string, file: File): Promise<void> {
  const sdk = await getSDK();
  await sdk.Buckets.upload({ bucketName: BUCKET_NAME, key, file });
}

export async function downloadFile(key: string): Promise<Blob> {
  const sdk = await getSDK();
  return sdk.Buckets.download({ bucketName: BUCKET_NAME, key });
}

export async function uploadJSON(key: string, data: unknown): Promise<void> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], key.split('/').pop() ?? 'data.json');
  await uploadFile(key, file);
}

export async function downloadJSON<T>(key: string): Promise<T> {
  const blob = await downloadFile(key);
  const text = await blob.text();
  return JSON.parse(text) as T;
}
