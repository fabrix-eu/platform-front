import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markSectionRead, type CommunitySection } from './feed';
import type { User } from './auth';

export function useMarkRead(communitySlug: string | undefined, section: CommunitySection) {
  const qc = useQueryClient();
  const markedRef = useRef<string>(undefined);

  useEffect(() => {
    if (!communitySlug) return;

    const key = `${communitySlug}:${section}`;
    if (markedRef.current === key) return;
    markedRef.current = key;

    qc.setQueryData<User>(['me'], (old) => {
      if (!old) return old;
      return {
        ...old,
        accessible_communities: old.accessible_communities.map((c) =>
          c.slug === communitySlug
            ? { ...c, unread_sections: c.unread_sections.filter((s) => s !== section) }
            : c,
        ),
      };
    });

    markSectionRead(communitySlug, section).catch(() => {});
  }, [communitySlug, section, qc]);
}
