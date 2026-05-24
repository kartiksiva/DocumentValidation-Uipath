import { UiPath } from '@uipath/uipath-typescript';

let initPromise: Promise<InstanceType<typeof UiPath>> | null = null;

export async function getSDK(): Promise<InstanceType<typeof UiPath>> {
  if (!initPromise) {
    initPromise = (async () => {
      const sdk = new UiPath();
      await sdk.initialize();
      return sdk;
    })();
  }
  return initPromise;
}
