import { getSDK } from './sdk';
const WS_ENTITY = 'ContractWorkspace';
const TEMPLATE_ENTITY = 'Template';
const GUIDELINE_ENTITY = 'Guideline';
const entityCache = new Map();
async function getEntity(name) {
    if (entityCache.has(name))
        return entityCache.get(name);
    const sdk = await getSDK();
    const all = await sdk.entities.getAll();
    const found = all.find((e) => e.name === name);
    if (!found)
        throw new Error(`Entity '${name}' not found`);
    entityCache.set(name, found);
    return found;
}
export async function listWorkspaces() {
    const entity = await getEntity(WS_ENTITY);
    const result = await entity.getAllRecords();
    return result.items;
}
export async function getWorkspace(id) {
    const entity = await getEntity(WS_ENTITY);
    return entity.getRecord(id);
}
export async function createWorkspace(data) {
    const entity = await getEntity(WS_ENTITY);
    const result = await entity.insertRecord(data);
    return result;
}
export async function updateWorkspace(id, data) {
    const entity = await getEntity(WS_ENTITY);
    const result = await entity.updateRecord(id, data);
    return result;
}
export async function listTemplates() {
    const entity = await getEntity(TEMPLATE_ENTITY);
    const result = await entity.getAllRecords();
    return result.items;
}
export async function getTemplate(id) {
    const entity = await getEntity(TEMPLATE_ENTITY);
    return entity.getRecord(id);
}
export async function createTemplate(data) {
    const entity = await getEntity(TEMPLATE_ENTITY);
    const result = await entity.insertRecord(data);
    return result;
}
export async function updateTemplate(id, data) {
    const entity = await getEntity(TEMPLATE_ENTITY);
    const result = await entity.updateRecord(id, data);
    return result;
}
export async function listGuidelines() {
    const entity = await getEntity(GUIDELINE_ENTITY);
    const result = await entity.getAllRecords();
    return result.items;
}
export async function createGuideline(data) {
    const entity = await getEntity(GUIDELINE_ENTITY);
    const result = await entity.insertRecord(data);
    return result;
}
export async function updateGuideline(id, data) {
    const entity = await getEntity(GUIDELINE_ENTITY);
    const result = await entity.updateRecord(id, data);
    return result;
}
//# sourceMappingURL=entities.js.map