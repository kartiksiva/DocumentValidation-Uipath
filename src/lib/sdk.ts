import { UiPath } from '@uipath/uipath-typescript';

let initPromise: Promise<InstanceType<typeof UiPath>> | null = null;

export async function getSDK(): Promise<InstanceType<typeof UiPath>> {
  if (!initPromise) {
    initPromise = (async () => {
      // In dev, route SDK API calls through the Vite proxy to avoid CORS.
      if (import.meta.env.DEV) {
        const meta = document.querySelector('meta[name="uipath:base-url"]');
        if (meta) {
          const current = meta.getAttribute('content') ?? '';
          meta.setAttribute('content', current.replace('https://cloud.uipath.com', `${window.location.origin}/uipath-proxy`));
        }
      }
      const sdk = new UiPath();
      // Use org-specific identity endpoint; skip redundant acr_values on that endpoint.
      sdk.setMultiLogin();
      await sdk.initialize();
      return sdk;
    })();
  }
  return initPromise;
}
