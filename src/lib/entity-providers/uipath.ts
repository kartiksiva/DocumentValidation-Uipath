import { getSDK } from '../sdk';
import type { ContractWorkspace } from '../../types/workspace';
import type { Template, Guideline } from '../../types/template';
import type { EntityStore } from './interface';

type RawRecord = Record<string, unknown>;

const WS = 'ContractWorkspace';
const TPL = 'Template';
const GL = 'Guideline';

const cache = new Map<string, ReturnType<Awaited<ReturnType<typeof getSDK>>['entities']['getAll']> extends Promise<infer T> ? T extends Array<infer U> ? U : never : never>();

async function getEntity(name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const sdk = await getSDK();
  const all = await sdk.entities.getAll();
  const found = all.find(e => e.name === name);
  if (!found) throw new Error(`Entity '${name}' not found in UiPath Data Fabric`);
  cache.set(name, found);
  return found;
}

function deWS(raw: RawRecord): ContractWorkspace {
  return {
    ...(raw as unknown as ContractWorkspace),
    id: raw['Id'] as string,
    versions: JSON.parse((raw['versions'] as string) || '[]'),
    comparisons: JSON.parse((raw['comparisons'] as string) || '[]'),
  };
}
function deTpl(raw: RawRecord): Template {
  return {
    ...(raw as unknown as Template),
    id: raw['Id'] as string,
    linkedGuidelineIds: JSON.parse((raw['linkedGuidelineIds'] as string) || '[]'),
  };
}
function deGL(raw: RawRecord): Guideline {
  return {
    ...(raw as unknown as Guideline),
    id: raw['Id'] as string,
    linkedTemplateIds: JSON.parse((raw['linkedTemplateIds'] as string) || '[]'),
  };
}
function seWS(d: Partial<ContractWorkspace>): RawRecord {
  return { ...d, versions: JSON.stringify(d.versions ?? []), comparisons: JSON.stringify(d.comparisons ?? []) };
}
function seTpl(d: Partial<Template>): RawRecord {
  return { ...d, linkedGuidelineIds: JSON.stringify(d.linkedGuidelineIds ?? []) };
}
function seGL(d: Partial<Guideline>): RawRecord {
  return { ...d, linkedTemplateIds: JSON.stringify(d.linkedTemplateIds ?? []) };
}

export const uipathProvider: EntityStore = {
  async listWorkspaces() {
    const e = await getEntity(WS);
    const r = await e.getAllRecords();
    return (r.items as RawRecord[]).map(deWS);
  },
  async getWorkspace(id) {
    const e = await getEntity(WS);
    return deWS(await e.getRecord(id) as RawRecord);
  },
  async createWorkspace(d) {
    const e = await getEntity(WS);
    return deWS(await e.insertRecord(seWS(d)) as RawRecord);
  },
  async updateWorkspace(id, d) {
    const e = await getEntity(WS);
    return deWS(await e.updateRecord(id, seWS(d)) as RawRecord);
  },

  async listTemplates() {
    const e = await getEntity(TPL);
    const r = await e.getAllRecords();
    return (r.items as RawRecord[]).map(deTpl);
  },
  async getTemplate(id) {
    const e = await getEntity(TPL);
    return deTpl(await e.getRecord(id) as RawRecord);
  },
  async createTemplate(d) {
    const e = await getEntity(TPL);
    return deTpl(await e.insertRecord(seTpl(d)) as RawRecord);
  },
  async updateTemplate(id, d) {
    const e = await getEntity(TPL);
    return deTpl(await e.updateRecord(id, seTpl(d)) as RawRecord);
  },

  async listGuidelines() {
    const e = await getEntity(GL);
    const r = await e.getAllRecords();
    return (r.items as RawRecord[]).map(deGL);
  },
  async createGuideline(d) {
    const e = await getEntity(GL);
    return deGL(await e.insertRecord(seGL(d)) as RawRecord);
  },
  async updateGuideline(id, d) {
    const e = await getEntity(GL);
    return deGL(await e.updateRecord(id, seGL(d)) as RawRecord);
  },
};
