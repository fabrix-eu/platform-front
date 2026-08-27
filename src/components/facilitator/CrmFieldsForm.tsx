import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNetworkOrganization, HEALTH_LEVELS, type NetworkOrganization } from '../../lib/networks';

const HEALTH_DOTS: Record<string, string> = {
  unknown: 'bg-gray-300',
  excellent: 'bg-emerald-500',
  good: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

function useSaveField(networkSlug: string, record: NetworkOrganization) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateNetworkOrganization>[2]) =>
      updateNetworkOrganization(networkSlug, record.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network_organization', networkSlug, record.id] });
      queryClient.invalidateQueries({ queryKey: ['network_organizations', networkSlug] });
    },
  });
}

/** Inline health select for the sheet header — reads as a status, edits in place. */
export function HealthSelect({
  networkSlug,
  record,
  field,
  label,
}: {
  networkSlug: string;
  record: NetworkOrganization;
  field: 'economic_health' | 'environmental_score';
  label: string;
}) {
  const save = useSaveField(networkSlug, record);
  const value = record[field];

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
      <span className={`h-2 w-2 rounded-full shrink-0 ${HEALTH_DOTS[value] ?? 'bg-gray-300'}`} />
      {label}
      <select
        value={value}
        onChange={(e) => save.mutate({ [field]: e.target.value })}
        disabled={save.isPending}
        className="bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer"
      >
        {Object.entries(HEALTH_LEVELS).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>
    </label>
  );
}

/** Compact business figures — each field saves on blur. */
export function BusinessDataCard({ networkSlug, record }: { networkSlug: string; record: NetworkOrganization }) {
  const save = useSaveField(networkSlug, record);

  const saveIfChanged = (field: string, raw: string, current: unknown, numeric: boolean) => {
    const value = numeric ? (raw === '' ? null : Number(raw)) : raw;
    const normalizedCurrent = numeric
      ? (current === null || current === undefined || current === '' ? null : Number(current))
      : (current ?? '');
    if (value !== normalizedCurrent) save.mutate({ [field]: value });
  };

  const inputCls =
    'w-full border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <section className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business data</h2>
        <span className="text-xs text-gray-300">{save.isPending ? 'Saving…' : ''}</span>
      </div>
      <div className="space-y-3">
        <div>
          <label htmlFor="specialization" className="block text-xs text-gray-400 mb-1">Specialization</label>
          <input
            id="specialization"
            defaultValue={record.specialization ?? ''}
            onBlur={(e) => saveIfChanged('specialization', e.target.value, record.specialization, false)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="annual_turnover" className="block text-xs text-gray-400 mb-1">Turnover €</label>
            <input
              id="annual_turnover"
              type="number"
              step="0.01"
              defaultValue={record.annual_turnover ?? ''}
              onBlur={(e) => saveIfChanged('annual_turnover', e.target.value, record.annual_turnover, true)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="number_of_employees" className="block text-xs text-gray-400 mb-1">Employees</label>
            <input
              id="number_of_employees"
              type="number"
              defaultValue={record.number_of_employees ?? ''}
              onBlur={(e) => saveIfChanged('number_of_employees', e.target.value, record.number_of_employees, true)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="growth_rate" className="block text-xs text-gray-400 mb-1">Growth %</label>
            <input
              id="growth_rate"
              type="number"
              step="0.01"
              defaultValue={record.growth_rate ?? ''}
              onBlur={(e) => saveIfChanged('growth_rate', e.target.value, record.growth_rate, true)}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
