import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Compass,
  Home,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
} from 'lucide-react';

/* The atoms, written once against the semantic tokens. Nothing here knows
   which direction is active — that is a class on an ancestor. If an atom
   needs a hard-coded value, the system is missing a token. */

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="border-t border-fx-line py-6 first:border-t-0">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-fx-display text-fx-heading text-fx-ink">{label}</h3>
        {hint && <p className="text-fx-small text-fx-muted">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────
// The primary is the emphasis colour: violet in the prototype direction,
// ink in the refashion one. Shape comes from --radius-fx-action, which is
// a rounded rectangle in one direction and a pill in the other.

const btn = 'inline-flex items-center gap-2 rounded-fx-action font-fx-text font-bold transition';
const btnMd = 'px-5 py-2.5 text-fx-body';

export const Buttons = () => (
  <>
    <button type="button" className={`${btn} ${btnMd} bg-fx-emphasis text-fx-emphasis-ink hover:brightness-110`}>
      <Plus className="size-4" strokeWidth={2.6} />
      Add a listing
    </button>
    <button
      type="button"
      className={`${btn} ${btnMd} bg-fx-paper text-fx-ink border-2 border-fx-emphasis hover:bg-fx-emphasis-soft`}
    >
      Invite a partner
    </button>
    <button type="button" className={`${btn} ${btnMd} bg-fx-paper text-fx-ink2 border border-fx-line2 hover:border-fx-ink`}>
      Browse the directory
      <ArrowUpRight className="size-4" strokeWidth={2.4} />
    </button>
    <button type="button" className={`${btn} px-4 py-1.5 text-fx-small bg-fx-emphasis text-fx-emphasis-ink`}>
      Small
    </button>
    <button type="button" disabled className={`${btn} ${btnMd} bg-fx-line text-fx-muted cursor-not-allowed`}>
      Disabled
    </button>
  </>
);

// ── Filter pills ────────────────────────────────────────────────────────
// Selected is a solid fill. The prototype tinted it; a tint at 12px is the
// difference between "this filter is on" and "did I click that?".

const pill = 'rounded-full border px-4 py-2 text-fx-small font-fx-text font-bold transition';

export const Pills = () => (
  <>
    <button type="button" className={`${pill} border-fx-emphasis bg-fx-emphasis text-fx-emphasis-ink`}>Everyone</button>
    <button type="button" className={`${pill} border-fx-line2 bg-fx-paper text-fx-ink2 hover:border-fx-emphasis`}>Organisations</button>
    <button type="button" className={`${pill} border-fx-line2 bg-fx-paper text-fx-ink2 hover:border-fx-emphasis`}>Facilitators</button>
    <button type="button" className={`${pill} border-fx-line2 bg-fx-paper text-fx-ink2 hover:border-fx-emphasis`}>Researchers</button>
  </>
);

// ── Badges ──────────────────────────────────────────────────────────────

function Badge({ bg, ink, children }: { bg: string; ink: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-fx-sm px-2.5 py-1 font-fx-display text-fx-label uppercase"
      style={{ backgroundColor: `var(${bg})`, color: `var(${ink})` }}
    >
      {children}
    </span>
  );
}

export const Badges = () => (
  <>
    <Badge bg="--color-fx-green-soft" ink="--color-fx-green">Materials</Badge>
    <Badge bg="--color-fx-amber-soft" ink="--color-fx-amber">Capacities</Badge>
    <Badge bg="--color-fx-teal-soft" ink="--color-fx-teal">Services</Badge>
    <Badge bg="--color-fx-rose-soft" ink="--color-fx-rose">Products</Badge>
    <Badge bg="--color-fx-indigo-soft" ink="--color-fx-indigo">Distribution</Badge>
    <span className="inline-flex items-center rounded-fx-sm bg-fx-orange px-2.5 py-1 font-fx-display text-fx-label text-white uppercase">
      Wanted
    </span>
    <span className="inline-flex items-center rounded-fx-sm bg-fx-slate-soft px-2.5 py-1 font-fx-display text-fx-label text-fx-ink2 uppercase">
      Draft
    </span>
  </>
);

// ── Form controls ───────────────────────────────────────────────────────

export const Fields = () => (
  <div className="grid w-full gap-4 sm:grid-cols-3">
    <label className="block">
      <span className="mb-2 block font-fx-display text-fx-label text-fx-muted uppercase">Organisation name</span>
      <input
        defaultValue="Maasstad Textiles"
        className="w-full rounded-fx border border-fx-line2 bg-fx-paper px-4 py-3 text-fx-body text-fx-ink outline-none focus:border-fx-emphasis"
      />
    </label>
    <label className="block">
      <span className="mb-2 block font-fx-display text-fx-label text-fx-muted uppercase">Kind</span>
      <div className="flex items-center justify-between rounded-fx border border-fx-line2 bg-fx-paper px-4 py-3 text-fx-body text-fx-ink">
        Producer
        <ChevronDown className="size-4 text-fx-muted" />
      </div>
    </label>
    <label className="block">
      <span className="mb-2 block font-fx-display text-fx-label text-fx-muted uppercase">Search</span>
      <div className="flex items-center gap-2 rounded-fx border border-fx-line2 bg-fx-paper px-4 py-3">
        <Search className="size-4 text-fx-muted" />
        <span className="text-fx-body text-fx-muted">What you need or offer</span>
      </div>
    </label>
  </div>
);

export const Toggles = () => (
  <>
    <span className="flex items-center gap-3 text-fx-body text-fx-ink2">
      <span className="relative h-6 w-11 rounded-full bg-fx-emphasis">
        <span className="absolute top-1 left-6 size-4 rounded-full bg-white" />
      </span>
      On
    </span>
    <span className="flex items-center gap-3 text-fx-body text-fx-ink2">
      <span className="relative h-6 w-11 rounded-full bg-fx-line2">
        <span className="absolute top-1 left-1 size-4 rounded-full bg-fx-paper" />
      </span>
      Off
    </span>
    <span className="flex items-center gap-3 text-fx-body text-fx-ink2">
      <span className="flex size-5 items-center justify-center rounded-[6px] bg-fx-emphasis">
        <Check className="size-3.5 text-fx-emphasis-ink" strokeWidth={3} />
      </span>
      Checked
    </span>
    <span className="flex items-center gap-3 text-fx-body text-fx-ink2">
      <span className="size-5 rounded-[6px] border-2 border-fx-line2" />
      Unchecked
    </span>
  </>
);

// ── Identity ────────────────────────────────────────────────────────────
// Organisations are squares, people are circles — one rule, no ambiguity.

export const Avatars = () => (
  <>
    <span className="flex size-12 items-center justify-center rounded-fx bg-fx-emphasis font-fx-display text-[15px] font-extrabold text-fx-emphasis-ink">MT</span>
    <span className="flex size-12 items-center justify-center rounded-fx bg-fx-teal font-fx-display text-[15px] font-extrabold text-white">RR</span>
    <span className="flex size-12 items-center justify-center rounded-fx bg-fx-green-soft font-fx-display text-[15px] font-extrabold text-fx-green">LR</span>
    <span className="flex size-12 items-center justify-center rounded-full bg-fx-rose-soft font-fx-display text-[15px] font-extrabold text-fx-rose">JW</span>
    <span className="flex size-8 items-center justify-center rounded-fx-sm bg-fx-emphasis font-fx-display text-[11px] font-extrabold text-fx-emphasis-ink">DV</span>
  </>
);

// ── Navigation ──────────────────────────────────────────────────────────

export const NavItems = () => (
  <div className="w-64 rounded-fx-lg border border-fx-line bg-fx-paper p-3">
    <span className="flex items-center gap-3 rounded-fx px-3 py-2.5 font-fx-text text-fx-body font-medium text-fx-ink2">
      <Home className="size-[19px] text-fx-muted" strokeWidth={1.9} />
      Home
    </span>
    <span className="flex items-center gap-3 rounded-fx bg-fx-emphasis px-3 py-2.5 font-fx-text text-fx-body font-bold text-fx-emphasis-ink">
      <ShoppingBag className="size-[19px]" strokeWidth={2.2} />
      Marketplace
      <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-fx-small font-bold">3</span>
    </span>
    <span className="flex items-center gap-3 rounded-fx px-3 py-2.5 font-fx-text text-fx-body font-medium text-fx-ink2">
      <Compass className="size-[19px] text-fx-muted" strokeWidth={1.9} />
      Compass
    </span>
    <span className="flex items-center gap-3 rounded-fx px-3 py-2.5 font-fx-text text-fx-body font-medium text-fx-ink2">
      <Bell className="size-[19px] text-fx-muted" strokeWidth={1.9} />
      Notifications
      <span className="ml-auto rounded-full bg-fx-orange px-2 py-0.5 text-fx-small font-bold text-white">5</span>
    </span>
  </div>
);

export const Tabs = () => (
  <div className="flex gap-8 border-b border-fx-line">
    <span className="-mb-px border-b-[3px] border-fx-emphasis pb-3 font-fx-display text-[15px] font-extrabold text-fx-ink">Overview</span>
    <span className="-mb-px border-b-[3px] border-transparent pb-3 font-fx-display text-[15px] font-bold text-fx-muted">Listings</span>
    <span className="-mb-px border-b-[3px] border-transparent pb-3 font-fx-display text-[15px] font-bold text-fx-muted">Connections</span>
    <span className="-mb-px border-b-[3px] border-transparent pb-3 font-fx-display text-[15px] font-bold text-fx-muted">Members</span>
  </div>
);

// ── Surfaces ────────────────────────────────────────────────────────────

export const Cards = () => (
  <div className="grid w-full gap-4 sm:grid-cols-3">
    <div className="rounded-fx-lg border border-fx-line bg-fx-paper p-5">
      <Badge bg="--color-fx-green-soft" ink="--color-fx-green">Materials</Badge>
      <h4 className="mt-3 font-fx-display text-fx-heading text-fx-ink">Woven cotton roll-ends</h4>
      <p className="mt-2 text-fx-small text-fx-ink2">
        Regular surplus from our weaving line — natural and dyed cotton, by weight.
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-fx-line pt-4">
        <span className="flex size-7 items-center justify-center rounded-fx-sm bg-fx-emphasis font-fx-display text-[10px] font-extrabold text-fx-emphasis-ink">MT</span>
        <span className="text-fx-small text-fx-ink2">Maasstad Textiles</span>
        <span className="ml-auto flex items-center gap-1 text-fx-small text-fx-muted">
          <MapPin className="size-3.5" /> Rotterdam
        </span>
      </div>
    </div>

    {/* The one surface the prototype never had: a solid brand block. */}
    <div className="rounded-fx-lg bg-fx-emphasis p-5 text-fx-emphasis-ink">
      <span className="font-fx-display text-fx-label uppercase opacity-70">This month</span>
      <p className="mt-3 font-fx-display text-fx-display">47</p>
      <p className="mt-1 text-fx-small opacity-85">partners invited by members</p>
    </div>

    <div className="rounded-fx-lg bg-fx-emphasis-soft p-5 text-fx-ink">
      <span className="font-fx-display text-fx-label uppercase text-fx-muted">Get started</span>
      <h4 className="mt-3 font-fx-display text-fx-heading">Add the partners you already work with</h4>
      <p className="mt-2 text-fx-small text-fx-ink2">
        They keep your profile honest, and they get invited to claim theirs.
      </p>
      <button type="button" className={`${btn} mt-4 px-4 py-2 text-fx-small bg-fx-emphasis text-fx-emphasis-ink`}>
        Add a partner
      </button>
    </div>
  </div>
);

export const Banners = () => (
  <div className="grid w-full gap-3">
    <div className="flex flex-wrap items-center gap-4 rounded-fx-lg bg-fx-amber-soft px-5 py-4 text-fx-ink">
      <span className="font-fx-display text-fx-label text-fx-amber uppercase">Heads up</span>
      <p className="text-fx-body">Complete your profile to appear in the directory filters.</p>
      <button type="button" className={`${btn} ml-auto px-4 py-2 text-fx-small bg-fx-emphasis text-fx-emphasis-ink`}>
        Complete it
      </button>
    </div>
    <div className="flex flex-wrap items-center gap-4 rounded-fx-lg border-2 border-fx-emphasis bg-fx-paper px-5 py-4 text-fx-ink">
      <span className="font-fx-display text-fx-label text-fx-emphasis uppercase">Read-only</span>
      <p className="text-fx-body">Claim an organisation to connect, follow or post.</p>
    </div>
  </div>
);

export const EmptyState = () => (
  <div className="w-full rounded-fx-lg border-2 border-dashed border-fx-line2 px-6 py-12 text-center">
    <p className="font-fx-display text-fx-title text-fx-ink">Nothing here yet</p>
    <p className="mx-auto mt-2 max-w-sm text-fx-body text-fx-ink2">
      No listings match those filters. Widen the radius, or be the first to post one.
    </p>
    <button type="button" className={`${btn} mt-5 px-5 py-2.5 text-fx-body bg-fx-emphasis text-fx-emphasis-ink`}>
      <Plus className="size-4" strokeWidth={2.6} />
      Add a listing
    </button>
  </div>
);
