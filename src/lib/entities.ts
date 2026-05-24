import { getSDK } from './sdk';
import type { EntityGetResponse } from '@uipath/uipath-typescript';
import type { ContractWorkspace } from '../types/workspace';
import type { Template, Guideline } from '../types/template';

const WS_ENTITY = 'ContractWorkspace';
const TEMPLATE_ENTITY = 'Template';
const GUIDELINE_ENTITY = 'Guideline';

const entityCache = new Map<string, EntityGetResponse>();

async function getEntity(name: string): Promise<EntityGetResponse> {
  if (entityCache.has(name)) return entityCache.get(name)!;
  const sdk = await getSDK();
  const all = await sdk.entities.getAll();
  const found = all.find((e) => e.name === name);
  if (!found) throw new Error(`Entity '${name}' not found`);
  entityCache.set(name, found);
  return found;
}

export async function listWorkspaces(): Promise<ContractWorkspace[]> {
  const entity = await getEntity(WS_ENTITY);
  const result = await entity.getAllRecords();
  return result.items as unknown as ContractWorkspace[];
}

export async function getWorkspace(id: string): Promise<ContractWorkspace> {
  const entity = await getEntity(WS_ENTITY);
  return entity.getRecord(id) as unknown as ContractWorkspace;
}

export async function createWorkspace(data: Omit<ContractWorkspace, 'id'>): Promise<ContractWorkspace> {
  const entity = await getEntity(WS_ENTITY);
  const result = await entity.insertRecord(data as Record<string, unknown>);
  return result as unknown as ContractWorkspace;
}

export async function updateWorkspace(id: string, data: Partial<ContractWorkspace>): Promise<ContractWorkspace> {
  const entity = await getEntity(WS_ENTITY);
  const result = await entity.updateRecord(id, data as Record<string, unknown>);
  return result as unknown as ContractWorkspace;
}

export async function listTemplates(): Promise<Template[]> {
  const entity = await getEntity(TEMPLATE_ENTITY);
  const result = await entity.getAllRecords();
  return result.items as unknown as Template[];
}

export async function getTemplate(id: string): Promise<Template> {
  const entity = await getEntity(TEMPLATE_ENTITY);
  return entity.getRecord(id) as unknown as Template;
}

export async function createTemplate(data: Omit<Template, 'id'>): Promise<Template> {
  const entity = await getEntity(TEMPLATE_ENTITY);
  const result = await entity.insertRecord(data as Record<string, unknown>);
  return result as unknown as Template;
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  const entity = await getEntity(TEMPLATE_ENTITY);
  const result = await entity.updateRecord(id, data as Record<string, unknown>);
  return result as unknown as Template;
}

export async function listGuidelines(): Promise<Guideline[]> {
  const entity = await getEntity(GUIDELINE_ENTITY);
  const result = await entity.getAllRecords();
  return result.items as unknown as Guideline[];
}

export async function createGuideline(data: Omit<Guideline, 'id'>): Promise<Guideline> {
  const entity = await getEntity(GUIDELINE_ENTITY);
  const result = await entity.insertRecord(data as Record<string, unknown>);
  return result as unknown as Guideline;
}

export async function updateGuideline(id: string, data: Partial<Guideline>): Promise<Guideline> {
  const entity = await getEntity(GUIDELINE_ENTITY);
  const result = await entity.updateRecord(id, data as Record<string, unknown>);
  return result as unknown as Guideline;
}
