import { useState } from 'react';
import type { ContractWorkspace } from '../../types/workspace';
import { createWorkspace } from '../../lib/entities';

interface Props {
  onClose: () => void;
  onCreate: (ws: ContractWorkspace) => void;
}

const FIELDS = [
  { key: 'name',          label: 'Workspace Name',   placeholder: 'e.g. ACME Supply Agreement Q3', required: true },
  { key: 'description',   label: 'Description',      placeholder: 'Brief purpose of this workspace', required: false },
  { key: 'buyerParty',    label: 'Buyer Party',      placeholder: 'e.g. ACME Corp', required: true },
  { key: 'sellerParty',   label: 'Seller Party',     placeholder: 'e.g. Global Supplies Ltd', required: true },
  { key: 'contractType',  label: 'Contract Type',    placeholder: 'e.g. Supply Agreement, NDA, SaaS', required: true },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

export default function NewWorkspaceModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState<Record<FieldKey, string>>({
    name: '', description: '', buyerParty: '', sellerParty: '', contractType: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const ws = await createWorkspace({
        name: form.name.trim(),
        description: form.description.trim(),
        buyerParty: form.buyerParty.trim(),
        sellerParty: form.sellerParty.trim(),
        contractType: form.contractType.trim(),
        defaultTemplateId: '',
        ownerId: '',
        createdAt: new Date().toISOString(),
        versions: [],
        comparisons: [],
      });
      onCreate(ws);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workspace');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">New Workspace</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {FIELDS.map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                placeholder={placeholder}
                value={form[key]}
                required={required}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
