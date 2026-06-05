import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { markSectionRead, type CommunitySection } from './feed';

export function useMarkRead(communitySlug: string | undefined, section: CommunitySection) {
  const qc = useQueryClient();
  const markedRef = useRef<string>(undefined);

  useEffect(() => {
    if (!communitySlug) return;

    const key = `${communitySlug}:${section}`;
    if (markedRef.current === key) return;
    markedRef.current = key;

    markSectionRead(communitySlug, section).then(() => {
      qc.invalidateQueries({ queryKey: ['me'] });
    }).catch(() => {});
  }, [communitySlug, section, qc]);
}
