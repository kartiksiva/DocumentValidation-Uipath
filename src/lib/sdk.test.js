import { describe, it, expect, vi } from 'vitest';
vi.mock('@uipath/uipath-typescript', () => ({
    UiPath: class {
        initialize = vi.fn().mockResolvedValue(undefined);
        Buckets = {};
        Entities = {};
        MaestroProcesses = {};
        Tasks = {};
    },
}));
describe('sdk', () => {
    it('returns same instance on repeated calls', async () => {
        const { getSDK } = await import('./sdk');
        const a = await getSDK();
        const b = await getSDK();
        expect(a).toBe(b);
    });
});
//# sourceMappingURL=sdk.test.js.map