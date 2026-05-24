import { UiPath } from '@uipath/uipath-typescript';

let instance: InstanceType<typeof UiPath> | null = null;

export async function getSDK(): Promise<InstanceType<typeof UiPath>> {
  if (instance) return instance;
  instance = new UiPath();
  await instance.initialize();
  return instance;
}
