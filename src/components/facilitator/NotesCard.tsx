import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNetworkOrganization, type NetworkOrganization } from '../../lib/networks';

/** The facilitator's free-form notes — first thing on the sheet, autosaved. */
export function NotesCard({ networkSlug, record }: { networkSlug: string; record: NetworkOrganization }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(record.notes ?? '');
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = useMutation({
    mutationFn: (notes: string) => updateNetworkOrganization(networkSlug, record.id, { notes }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['network_organization', networkSlug, record.id] });
    },
  });

  const onChange = (next: string) => {
    setValue(next);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save.mutate(next), 800);
  };

  return (
    <section className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</h2>
        <span className="text-xs text-gray-300">
          {save.isPending ? 'Saving…' : saved ? 'Saved' : ''}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          if (value !== (record.notes ?? '')) save.mutate(value);
        }}
        rows={value ? Math.min(8, Math.max(2, value.split('\n').length)) : 2}
        placeholder="Anything your team should know about this organization…"
        className="w-full text-sm text-gray-800 placeholder-gray-300 focus:outline-none resize-none leading-relaxed"
      />
    </section>
  );
}
