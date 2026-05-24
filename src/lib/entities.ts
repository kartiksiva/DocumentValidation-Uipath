import { getStore } from './entity-providers';
import type { ContractWorkspace } from '../types/workspace';
import type { Template, Guideline } from '../types/template';

export async function listWorkspaces(): Promise<ContractWorkspace[]> {
  return (await getStore()).listWorkspaces();
}
export async function getWorkspace(id: string): Promise<ContractWorkspace> {
  return (await getStore()).getWorkspace(id);
}
export async function createWorkspace(data: Omit<ContractWorkspace, 'id'>): Promise<ContractWorkspace> {
  return (await getStore()).createWorkspace(data);
}
export async function updateWorkspace(id: string, data: Partial<ContractWorkspace>): Promise<ContractWorkspace> {
  return (await getStore()).updateWorkspace(id, data);
}

export async function listTemplates(): Promise<Template[]> {
  return (await getStore()).listTemplates();
}
export async function getTemplate(id: string): Promise<Template> {
  return (await getStore()).getTemplate(id);
}
export async function createTemplate(data: Omit<Template, 'id'>): Promise<Template> {
  return (await getStore()).createTemplate(data);
}
export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  return (await getStore()).updateTemplate(id, data);
}

export async function listGuidelines(): Promise<Guideline[]> {
  return (await getStore()).listGuidelines();
}
export async function createGuideline(data: Omit<Guideline, 'id'>): Promise<Guideline> {
  return (await getStore()).createGuideline(data);
}
export async function updateGuideline(id: string, data: Partial<Guideline>): Promise<Guideline> {
  return (await getStore()).updateGuideline(id, data);
}
