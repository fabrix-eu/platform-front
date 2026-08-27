import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNetworkOrganization, type NetworkOrganization } from '../../lib/networks';

// The facilitator's needs assessment — restored from the legacy front
// (mantel_front src/lib/constants/needs.ts); keys match the prod jsonb data.
const NEED_OPTIONS: { key: string; label: string; description: string }[] = [
  { key: 'financial_support', label: 'Financial Support', description: 'Access to funding, grants, or investment opportunities' },
  { key: 'technical_expertise', label: 'Technical Expertise', description: 'Specialized knowledge in production, processes, or technology' },
  { key: 'market_access', label: 'Market Access', description: 'Help entering new markets or reaching new customers' },
  { key: 'supply_chain_optimization', label: 'Supply Chain Optimization', description: 'Improving efficiency and sustainability in supply chain' },
  { key: 'regulatory_compliance', label: 'Regulatory Compliance', description: 'Understanding and meeting regulatory requirements' },
  { key: 'sustainability_consulting', label: 'Sustainability Consulting', description: 'Guidance on environmental and social sustainability practices' },
  { key: 'digital_transformation', label: 'Digital Transformation', description: 'Modernizing digital processes and systems' },
  { key: 'talent_acquisition', label: 'Talent Acquisition', description: 'Finding and hiring skilled workers' },
  { key: 'partnership_opportunities', label: 'Partnership Opportunities', description: 'Connecting with potential business partners' },
  { key: 'innovation_support', label: 'Innovation Support', description: 'R&D support and access to innovation networks' },
];

type Needs = Record<string, { selected?: boolean; note?: string }>;

export function NeedsChecklist({ networkSlug, record }: { networkSlug: string; record: NetworkOrganization }) {
  const queryClient = useQueryClient();
  const [needs, setNeeds] = useState<Needs>((record.needs as Needs) ?? {});

  const save = useMutation({
    mutationFn: (next: Needs) =>
      updateNetworkOrganization(networkSlug, record.id, { needs: next }),
    onError: () => {
      // Revert to the server state on failure
      setNeeds((record.needs as Needs) ?? {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network_organization', networkSlug, record.id] });
    },
  });

  const toggle = (key: string) => {
    const current = needs[key];
    const next: Needs = { ...needs, [key]: { selected: !current?.selected, note: current?.note ?? '' } };
    setNeeds(next);
    save.mutate(next);
  };

  const setNote = (key: string, note: string) => {
    setNeeds((prev) => ({ ...prev, [key]: { selected: prev[key]?.selected ?? false, note } }));
  };

  const persistNote = (key: string) => {
    save.mutate({ ...needs, [key]: { selected: needs[key]?.selected ?? false, note: needs[key]?.note ?? '' } });
  };

  const selectedCount = Object.values(needs).filter((n) => n?.selected).length;

  return (
    <section className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-sm font-semibold text-gray-900">Needs assessment</h2>
        {selectedCount > 0 && (
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {selectedCount} identified
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">Your team's diagnosis — private to the network.</p>

      <ul className="space-y-2.5">
        {NEED_OPTIONS.map((option) => {
          const value = needs[option.key];
          const selected = !!value?.selected;
          return (
            <li key={option.key}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(option.key)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring shrink-0"
                />
                <span className="min-w-0">
                  <span className={`text-sm block ${selected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-400 block">{option.description}</span>
                </span>
              </label>
              {selected && (
                <input
                  type="text"
                  value={value?.note ?? ''}
                  onChange={(e) => setNote(option.key, e.target.value)}
                  onBlur={() => persistNote(option.key)}
                  placeholder="Add a note..."
                  className="mt-1.5 ml-6 w-[calc(100%-1.5rem)] border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
