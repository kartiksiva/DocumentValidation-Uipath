import type { ContractWorkspace } from '../../types/workspace';
import type { Template, Guideline } from '../../types/template';

export interface EntityStore {
  listWorkspaces(): Promise<ContractWorkspace[]>;
  getWorkspace(id: string): Promise<ContractWorkspace>;
  createWorkspace(data: Omit<ContractWorkspace, 'id'>): Promise<ContractWorkspace>;
  updateWorkspace(id: string, data: Partial<ContractWorkspace>): Promise<ContractWorkspace>;

  listTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template>;
  createTemplate(data: Omit<Template, 'id'>): Promise<Template>;
  updateTemplate(id: string, data: Partial<Template>): Promise<Template>;

  listGuidelines(): Promise<Guideline[]>;
  createGuideline(data: Omit<Guideline, 'id'>): Promise<Guideline>;
  updateGuideline(id: string, data: Partial<Guideline>): Promise<Guideline>;
}
