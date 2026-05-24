import type { EntityStore } from './interface';

// Set VITE_ENTITY_PROVIDER=uipath to use UiPath Data Fabric (requires Enterprise/Pro tier).
// Defaults to supabase for Community Edition.
const provider = import.meta.env.VITE_ENTITY_PROVIDER ?? 'supabase';

async function load(): Promise<EntityStore> {
  if (provider === 'uipath') {
    const { uipathProvider } = await import('./uipath');
    return uipathProvider;
  }
  const { supabaseProvider } = await import('./supabase');
  return supabaseProvider;
}

let _store: EntityStore | null = null;

export async function getStore(): Promise<EntityStore> {
  if (!_store) _store = await load();
  return _store;
}
