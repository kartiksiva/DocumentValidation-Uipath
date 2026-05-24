import { createClient } from '@supabase/supabase-js';
import type { ContractWorkspace, WorkspaceVersion, WorkspaceComparison, ComparisonMode } from '../../types/workspace';
import type { Template, Guideline, TemplateStatus, GuidelineStatus } from '../../types/template';
import type { EntityStore } from './interface';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const db = createClient(url, key);

interface WorkspaceRow {
  id: string; name: string; description: string; default_template_id: string;
  buyer_party: string; seller_party: string; contract_type: string; owner_id: string;
  created_at: string; versions: WorkspaceVersion[]; comparisons: WorkspaceComparison[];
}
interface TemplateRow {
  id: string; name: string; description: string; bucket_key: string;
  system_message: string; linked_guideline_ids: string[];
  comparison_mode: ComparisonMode; status: TemplateStatus;
}
interface GuidelineRow {
  id: string; name: string; description: string; bucket_key: string;
  chunk_count: number; indexing_status: GuidelineStatus;
  linked_template_ids: string[]; uploaded_at: string;
}

const toWS = (r: WorkspaceRow): ContractWorkspace => ({
  id: r.id, name: r.name, description: r.description,
  defaultTemplateId: r.default_template_id, buyerParty: r.buyer_party,
  sellerParty: r.seller_party, contractType: r.contract_type, ownerId: r.owner_id,
  createdAt: r.created_at, versions: r.versions ?? [], comparisons: r.comparisons ?? [],
});

const toTpl = (r: TemplateRow): Template => ({
  id: r.id, name: r.name, description: r.description, bucketKey: r.bucket_key,
  systemMessage: r.system_message, linkedGuidelineIds: r.linked_guideline_ids ?? [],
  comparisonMode: r.comparison_mode, status: r.status,
});

const toGL = (r: GuidelineRow): Guideline => ({
  id: r.id, name: r.name, description: r.description, bucketKey: r.bucket_key,
  chunkCount: r.chunk_count, indexingStatus: r.indexing_status,
  linkedTemplateIds: r.linked_template_ids ?? [], uploadedAt: r.uploaded_at,
});

const fromWS = (d: Partial<ContractWorkspace>) => ({
  ...(d.name !== undefined && { name: d.name }),
  ...(d.description !== undefined && { description: d.description }),
  ...(d.defaultTemplateId !== undefined && { default_template_id: d.defaultTemplateId }),
  ...(d.buyerParty !== undefined && { buyer_party: d.buyerParty }),
  ...(d.sellerParty !== undefined && { seller_party: d.sellerParty }),
  ...(d.contractType !== undefined && { contract_type: d.contractType }),
  ...(d.ownerId !== undefined && { owner_id: d.ownerId }),
  ...(d.createdAt !== undefined && { created_at: d.createdAt }),
  ...(d.versions !== undefined && { versions: d.versions }),
  ...(d.comparisons !== undefined && { comparisons: d.comparisons }),
});

const fromTpl = (d: Partial<Template>) => ({
  ...(d.name !== undefined && { name: d.name }),
  ...(d.description !== undefined && { description: d.description }),
  ...(d.bucketKey !== undefined && { bucket_key: d.bucketKey }),
  ...(d.systemMessage !== undefined && { system_message: d.systemMessage }),
  ...(d.linkedGuidelineIds !== undefined && { linked_guideline_ids: d.linkedGuidelineIds }),
  ...(d.comparisonMode !== undefined && { comparison_mode: d.comparisonMode }),
  ...(d.status !== undefined && { status: d.status }),
});

const fromGL = (d: Partial<Guideline>) => ({
  ...(d.name !== undefined && { name: d.name }),
  ...(d.description !== undefined && { description: d.description }),
  ...(d.bucketKey !== undefined && { bucket_key: d.bucketKey }),
  ...(d.chunkCount !== undefined && { chunk_count: d.chunkCount }),
  ...(d.indexingStatus !== undefined && { indexing_status: d.indexingStatus }),
  ...(d.linkedTemplateIds !== undefined && { linked_template_ids: d.linkedTemplateIds }),
  ...(d.uploadedAt !== undefined && { uploaded_at: d.uploadedAt }),
});

function check<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data!;
}

export const supabaseProvider: EntityStore = {
  async listWorkspaces() {
    const { data, error } = await db.from('contract_workspaces').select('*').order('created_at', { ascending: false });
    return check(data, error)!.map(r => toWS(r as WorkspaceRow));
  },
  async getWorkspace(id) {
    const { data, error } = await db.from('contract_workspaces').select('*').eq('id', id).single();
    return toWS(check(data, error) as WorkspaceRow);
  },
  async createWorkspace(d) {
    const { data, error } = await db.from('contract_workspaces').insert(fromWS(d)).select().single();
    return toWS(check(data, error) as WorkspaceRow);
  },
  async updateWorkspace(id, d) {
    const { data, error } = await db.from('contract_workspaces').update(fromWS(d)).eq('id', id).select().single();
    return toWS(check(data, error) as WorkspaceRow);
  },

  async listTemplates() {
    const { data, error } = await db.from('templates').select('*').order('name');
    return check(data, error)!.map(r => toTpl(r as TemplateRow));
  },
  async getTemplate(id) {
    const { data, error } = await db.from('templates').select('*').eq('id', id).single();
    return toTpl(check(data, error) as TemplateRow);
  },
  async createTemplate(d) {
    const { data, error } = await db.from('templates').insert(fromTpl(d)).select().single();
    return toTpl(check(data, error) as TemplateRow);
  },
  async updateTemplate(id, d) {
    const { data, error } = await db.from('templates').update(fromTpl(d)).eq('id', id).select().single();
    return toTpl(check(data, error) as TemplateRow);
  },

  async listGuidelines() {
    const { data, error } = await db.from('guidelines').select('*').order('name');
    return check(data, error)!.map(r => toGL(r as GuidelineRow));
  },
  async createGuideline(d) {
    const { data, error } = await db.from('guidelines').insert(fromGL(d)).select().single();
    return toGL(check(data, error) as GuidelineRow);
  },
  async updateGuideline(id, d) {
    const { data, error } = await db.from('guidelines').update(fromGL(d)).eq('id', id).select().single();
    return toGL(check(data, error) as GuidelineRow);
  },
};
