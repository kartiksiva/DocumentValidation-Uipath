import { UiPath } from '@uipath/uipath-typescript';

let initPromise: Promise<InstanceType<typeof UiPath>> | null = null;

export async function getSDK(): Promise<InstanceType<typeof UiPath>> {
  if (!initPromise) {
    initPromise = (async () => {
      const sdk = new UiPath();
      // Use org-specific identity endpoint; skip redundant acr_values on that endpoint.
      sdk.setMultiLogin();
      await sdk.initialize();
      return sdk;
    })();
  }
  return initPromise;
}
