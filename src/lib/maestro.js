import { getSDK } from './sdk';
export async function startComparison(input, folderId = 0) {
    const sdk = await getSDK();
    await sdk.processes.start({ processName: 'ContractComparisonProcess', inputArguments: JSON.stringify(input) }, folderId);
}
//# sourceMappingURL=maestro.js.map