import { getSDK } from './sdk';
import type { ContractWorkspace } from '../types/workspace';
import type { Template, Guideline } from '../types/template';

const WS_ENTITY = 'ContractWorkspace';
const TEMPLATE_ENTITY = 'Template';
const GUIDELINE_ENTITY = 'Guideline';

export async function listWorkspaces(): Promise<ContractWorkspace[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: WS_ENTITY });
  return result.value as ContractWorkspace[];
}

export async function getWorkspace(id: string): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.getById({ entityName: WS_ENTITY, id }) as Promise<ContractWorkspace>;
}

export async function createWorkspace(data: Omit<ContractWorkspace, 'id'>): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: WS_ENTITY, data }) as Promise<ContractWorkspace>;
}

export async function updateWorkspace(id: string, data: Partial<ContractWorkspace>): Promise<ContractWorkspace> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: WS_ENTITY, id, data }) as Promise<ContractWorkspace>;
}

export async function listTemplates(): Promise<Template[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: TEMPLATE_ENTITY });
  return result.value as Template[];
}

export async function getTemplate(id: string): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.getById({ entityName: TEMPLATE_ENTITY, id }) as Promise<Template>;
}

export async function createTemplate(data: Omit<Template, 'id'>): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: TEMPLATE_ENTITY, data }) as Promise<Template>;
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: TEMPLATE_ENTITY, id, data }) as Promise<Template>;
}

export async function listGuidelines(): Promise<Guideline[]> {
  const sdk = await getSDK();
  const result = await sdk.Entities.list({ entityName: GUIDELINE_ENTITY });
  return result.value as Guideline[];
}

export async function createGuideline(data: Omit<Guideline, 'id'>): Promise<Guideline> {
  const sdk = await getSDK();
  return sdk.Entities.create({ entityName: GUIDELINE_ENTITY, data }) as Promise<Guideline>;
}

export async function updateGuideline(id: string, data: Partial<Guideline>): Promise<Guideline> {
  const sdk = await getSDK();
  return sdk.Entities.update({ entityName: GUIDELINE_ENTITY, id, data }) as Promise<Guideline>;
}
