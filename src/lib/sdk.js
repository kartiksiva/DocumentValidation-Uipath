import { UiPath } from '@uipath/uipath-typescript';
let instance = null;
export async function getSDK() {
    if (instance)
        return instance;
    instance = new UiPath();
    await instance.initialize();
    return instance;
}
//# sourceMappingURL=sdk.js.map