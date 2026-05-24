import { getSDK } from './sdk';
let _bucketId = 0;
let _folderId = 0;
export function configureBucket(bucketId, folderId) {
    _bucketId = bucketId;
    _folderId = folderId;
}
export function buildBucketKey(params) {
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
export async function uploadFile(key, file) {
    const sdk = await getSDK();
    await sdk.buckets.uploadFile({ bucketId: _bucketId, folderId: _folderId, path: key, content: file });
}
export async function downloadFile(key) {
    const sdk = await getSDK();
    const { uri } = await sdk.buckets.getReadUri({ bucketId: _bucketId, folderId: _folderId, path: key });
    const response = await fetch(uri);
    if (!response.ok)
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    return response.blob();
}
export async function uploadJSON(key, data) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], key.split('/').pop() ?? 'data.json');
    await uploadFile(key, file);
}
export async function downloadJSON(key) {
    const blob = await downloadFile(key);
    const text = await blob.text();
    return JSON.parse(text);
}
export async function initBuckets() {
    const sdk = await getSDK();
    const { items } = await sdk.buckets.getAll({ filter: "name eq 'contract-workspaces'" });
    const bucket = items.find(b => b.name === 'contract-workspaces');
    if (!bucket)
        throw new Error('contract-workspaces bucket not found');
    const token = sdk.getToken();
    if (!token)
        throw new Error('SDK not authenticated');
    const { baseUrl, orgName, tenantName } = sdk.config;
    const res = await fetch(`${baseUrl}/${orgName}/${tenantName}/orchestrator_/odata/Folders?$filter=Name eq 'Shared'&$select=Id`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok)
        throw new Error(`Folder lookup failed: ${res.status}`);
    const data = await res.json();
    const folderId = data.value[0]?.Id;
    if (!folderId)
        throw new Error('Shared folder not found');
    configureBucket(bucket.id, folderId);
}
//# sourceMappingURL=buckets.js.map