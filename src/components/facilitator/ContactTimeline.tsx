import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContactPoints,
  createContactPoint,
  deleteContactPoint,
  CONTACT_KINDS,
} from '../../lib/networks';

const KIND_ICONS: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  visit: '🏭',
  other: '📌',
};

export function ContactTimeline({ networkSlug, networkOrgId }: { networkSlug: string; networkOrgId: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['contact_points', networkSlug, networkOrgId],
    queryFn: () => getContactPoints(networkSlug, networkOrgId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contact_points', networkSlug, networkOrgId] });
  };

  const create = useMutation({
    mutationFn: (data: { kind: string; occurred_at?: string; summary: string }) =>
      createContactPoint(networkSlug, networkOrgId, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteContactPoint(networkSlug, networkOrgId, id),
    onSuccess: invalidate,
  });

  const points = query.data?.data ?? [];

  return (
    <section className="bg-white rounded-lg border border-border p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Interactions</h2>

      <form
        className="flex flex-wrap gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const summary = (fd.get('summary') as string).trim();
          if (!summary) return;
          create.mutate({
            kind: (fd.get('kind') as string) || 'other',
            occurred_at: (fd.get('occurred_at') as string) || undefined,
            summary,
          });
          e.currentTarget.reset();
        }}
      >
        <select
          name="kind"
          defaultValue="call"
          className="border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {Object.entries(CONTACT_KINDS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          name="occurred_at"
          type="date"
          className="border border-border rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          name="summary"
          placeholder="What happened?"
          className="flex-1 min-w-[180px] border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Log
        </button>
      </form>

      {query.isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : points.length === 0 ? (
        <p className="text-sm text-gray-400">No interaction logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {points.map((point) => (
            <li key={point.id} className="flex gap-3 group">
              <div className="shrink-0 h-8 w-8 rounded-full bg-gray-50 border border-border flex items-center justify-center text-sm">
                {KIND_ICONS[point.kind] ?? '📌'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">{point.summary}</p>
                <p className="text-xs text-gray-400">
                  {CONTACT_KINDS[point.kind] ?? point.kind}
                  {' · '}
                  {new Date(point.occurred_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {point.author && <> · {point.author.name}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(point.id)}
                aria-label="Delete contact point"
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
