import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNetworkOrganization, HEALTH_LEVELS, type NetworkOrganization } from '../../lib/networks';

/** Health / business tracking fields + private notes (server-authoritative form). */
export function CrmFieldsForm({ networkSlug, record }: { networkSlug: string; record: NetworkOrganization }) {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (data: Parameters<typeof updateNetworkOrganization>[2]) =>
      updateNetworkOrganization(networkSlug, record.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network_organization', networkSlug, record.id] });
      queryClient.invalidateQueries({ queryKey: ['network_organizations', networkSlug] });
    },
  });

  const num = (v: FormDataEntryValue | null) => {
    const s = (v as string) ?? '';
    return s === '' ? null : Number(s);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        save.mutate({
          economic_health: fd.get('economic_health') as string,
          environmental_score: fd.get('environmental_score') as string,
          specialization: (fd.get('specialization') as string) || '',
          annual_turnover: num(fd.get('annual_turnover')),
          number_of_employees: num(fd.get('number_of_employees')),
          growth_rate: num(fd.get('growth_rate')),
          notes: (fd.get('notes') as string) || '',
        });
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="economic_health" className="block text-sm font-medium text-gray-700 mb-1">Economic health</label>
          <select
            id="economic_health"
            name="economic_health"
            defaultValue={record.economic_health}
            className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(HEALTH_LEVELS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="environmental_score" className="block text-sm font-medium text-gray-700 mb-1">Environmental score</label>
          <select
            id="environmental_score"
            name="environmental_score"
            defaultValue={record.environmental_score}
            className="w-full border border-border rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(HEALTH_LEVELS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
          <input
            id="specialization"
            name="specialization"
            defaultValue={record.specialization ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="annual_turnover" className="block text-sm font-medium text-gray-700 mb-1">Annual turnover (€)</label>
          <input
            id="annual_turnover"
            name="annual_turnover"
            type="number"
            step="0.01"
            defaultValue={record.annual_turnover ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="number_of_employees" className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
          <input
            id="number_of_employees"
            name="number_of_employees"
            type="number"
            defaultValue={record.number_of_employees ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="growth_rate" className="block text-sm font-medium text-gray-700 mb-1">Growth rate (%)</label>
          <input
            id="growth_rate"
            name="growth_rate"
            type="number"
            step="0.01"
            defaultValue={record.growth_rate ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Private notes <span className="text-xs text-gray-400 font-normal">(visible to your team only)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={record.notes ?? ''}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {save.isPending ? 'Saving...' : 'Save'}
        </button>
        {save.isSuccess && <span className="text-sm text-green-600">Saved.</span>}
        {save.isError && <span className="text-sm text-red-600">Could not save.</span>}
      </div>
    </form>
  );
}
