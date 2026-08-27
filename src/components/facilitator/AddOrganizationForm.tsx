import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { searchOrganizations, type OrganizationBasic } from '../../lib/organizations';
import { addNetworkOrganization } from '../../lib/networks';

/** Autocomplete over the global directory → follow an organization. */
export function AddOrganizationForm({ networkSlug }: { networkSlug: string }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrganizationBasic[]>([]);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    if (query.length < 2) return;
    const t = setTimeout(() => {
      searchOrganizations(query).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const visibleResults = query.length >= 2 ? results : [];

  const add = useMutation({
    mutationFn: (organizationId: string) => addNetworkOrganization(networkSlug, organizationId),
    onSuccess: () => {
      justSelectedRef.current = true;
      setQuery('');
      setResults([]);
      queryClient.invalidateQueries({ queryKey: ['network_organizations', networkSlug] });
    },
  });

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Add an organization from the directory..."
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {visibleResults.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {visibleResults.slice(0, 8).map((org) => (
            <button
              key={org.id}
              type="button"
              disabled={add.isPending}
              onClick={() => add.mutate(org.id)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span className="truncate">{org.name}</span>
              <span className="text-xs text-primary shrink-0">+ Follow</span>
            </button>
          ))}
          <div className="border-t border-border px-3 py-2">
            <Link to="/organizations/new" className="text-xs text-gray-500 hover:text-primary">
              Not in the directory? Create it →
            </Link>
          </div>
        </div>
      )}
      {add.isError && (
        <p className="text-xs text-red-600 mt-1">Could not add (already followed?)</p>
      )}
    </div>
  );
}
