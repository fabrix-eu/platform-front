import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { getMe, type UserNetwork } from './auth';

const STORAGE_KEY = 'active_network_slug';

/**
 * The active facilitator network: `?network=slug` in the URL, falling back to
 * the last visited network (localStorage), then the user's first network.
 * The resolved slug is persisted so links that drop the param stay coherent.
 */
export function useFacilitatorNetwork(): {
  network: UserNetwork | null;
  networks: UserNetwork[];
  isLoading: boolean;
} {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { network: slugParam } = useSearch({ strict: false }) as { network?: string };

  const networks = me.data?.networks ?? [];

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }

  const network =
    (slugParam ? networks.find((n) => n.slug === slugParam) : undefined) ??
    (stored ? networks.find((n) => n.slug === stored) : undefined) ??
    networks[0] ??
    null;

  useEffect(() => {
    if (!network) return;
    try {
      localStorage.setItem(STORAGE_KEY, network.slug);
    } catch {
      // storage unavailable — the URL param still works
    }
  }, [network]);

  return { network, networks, isLoading: me.isLoading };
}
