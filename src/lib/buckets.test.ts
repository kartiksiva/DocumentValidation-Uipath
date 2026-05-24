import { describe, it, expect } from 'vitest';
import { buildBucketKey } from './buckets';

describe('buildBucketKey', () => {
  it('builds workspace version key', () => {
    const key = buildBucketKey({ workspaceId: 'ws1', versionNumber: 3, filename: 'doc.pdf' });
    expect(key).toBe('workspaces/ws1/versions/v3/doc.pdf');
  });

  it('builds comparison result key', () => {
    const key = buildBucketKey({ workspaceId: 'ws1', comparisonId: 'cmp1', artifact: 'findings.json' });
    expect(key).toBe('workspaces/ws1/comparisons/cmp1/findings.json');
  });

  it('builds template key', () => {
    const key = buildBucketKey({ templateId: 't1', filename: 'template.pdf' });
    expect(key).toBe('templates/t1/template.pdf');
  });

  it('builds guideline key', () => {
    const key = buildBucketKey({ guidelineId: 'g1', filename: 'source.pdf' });
    expect(key).toBe('guidelines/g1/source.pdf');
  });
});
