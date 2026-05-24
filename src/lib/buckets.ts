import { getSDK } from './sdk';

type VersionKeyParams = { workspaceId: string; versionNumber: number; filename: string };
type ComparisonKeyParams = { workspaceId: string; comparisonId: string; artifact: string };
type TemplateKeyParams = { templateId: string; filename: string };
type GuidelineKeyParams = { guidelineId: string; filename: string };

let _bucketId = 0;
let _folderId = 0;

export function configureBucket(bucketId: number, folderId: number): void {
  _bucketId = bucketId;
  _folderId = folderId;
}

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
  await sdk.buckets.uploadFile({ bucketId: _bucketId, folderId: _folderId, path: key, content: file });
}

export async function downloadFile(key: string): Promise<Blob> {
  const sdk = await getSDK();
  const { uri } = await sdk.buckets.getReadUri({ bucketId: _bucketId, folderId: _folderId, path: key });
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  return response.blob();
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

export async function initBuckets(): Promise<void> {
  const sdk = await getSDK();

  const { items } = await sdk.buckets.getAll({ filter: "name eq 'contract-workspaces'" });
  const bucket = items.find(b => b.name === 'contract-workspaces');
  if (!bucket) throw new Error('contract-workspaces bucket not found');

  // Numeric folder ID for the Shared folder — set via VITE_UIPATH_FOLDER_ID env var
  // (avoids a raw /odata/Folders API call that requires OR.Folders scope)
  const folderIdStr = import.meta.env.VITE_UIPATH_FOLDER_ID as string | undefined;
  if (!folderIdStr) throw new Error('VITE_UIPATH_FOLDER_ID is not set');
  const folderId = parseInt(folderIdStr, 10);
  if (isNaN(folderId)) throw new Error('VITE_UIPATH_FOLDER_ID is not a valid number');

  configureBucket(bucket.id, folderId);
}
