import { Heart, Pin } from 'lucide-react';
import type { PostAuthor } from '../../lib/posts';
import { formatDistanceToNow, getInitials } from '../../lib/utils';

export function AuthorLine({ author, date }: { author: PostAuthor; date: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {author.image_url ? (
        <img src={author.image_url} alt={author.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
          {getInitials(author.name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate leading-tight">
          {author.name}
          {author.organization && (
            <span className="text-gray-400 font-normal"> · {author.organization.name}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 leading-tight">{formatDistanceToNow(date)}</p>
      </div>
    </div>
  );
}

export function LikeButton({
  liked,
  count,
  onToggle,
  size = 'md',
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`inline-flex items-center gap-1 transition-colors ${
        liked ? 'text-rose-600' : 'text-gray-400 hover:text-rose-600'
      } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      <Heart className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span className="tabular-nums">{count}</span>}
    </button>
  );
}

export function PinnedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
      <Pin className="h-3 w-3" /> Pinned
    </span>
  );
}
