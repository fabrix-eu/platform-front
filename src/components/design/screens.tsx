import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Bell,
  Building2,
  Calendar,
  Compass,
  Home,
  LayoutGrid,
  List,
  Map,
  MapPin,
  MessageSquare,
  Network,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';

/* Composed screens — the atoms put back together in the shape the app
   actually has (AppSidebar + ExploreShell). Same rule as the atoms: no
   hard-coded values, so switching direction re-renders the whole screen.
   These are mock-ups, not routes: nothing here fetches or navigates. */

export function ScreenFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="@container overflow-hidden rounded-fx-lg border border-fx-line2 bg-fx-paper">
      <div className="flex items-center gap-3 border-b border-fx-line bg-fx-panel px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-fx-line2" />
          <span className="size-2.5 rounded-full bg-fx-line2" />
          <span className="size-2.5 rounded-full bg-fx-line2" />
        </span>
        <span className="rounded-full bg-fx-paper px-3 py-1 font-mono text-[11px] text-fx-muted">{url}</span>
      </div>
      {children}
    </div>
  );
}

// ── The app shell ───────────────────────────────────────────────────────
// The flat sidebar of AppSidebar.tsx: global entries, then the current
// organisation's, then personal. Active is a solid fill.

const NAV_GLOBAL = [
  { label: 'Home', icon: Home },
  { label: 'Marketplace', icon: ShoppingBag },
  { label: 'Events', icon: Calendar },
  { label: 'Directory', icon: Map },
];

const NAV_ORG = [
  { label: 'Profile', icon: Building2 },
  { label: 'Compass', icon: Compass },
  { label: 'Connections', icon: Network },
  { label: 'Members', icon: Users, badge: '2' },
  { label: 'Messages', icon: MessageSquare },
];

function NavEntry({
  label,
  icon: Icon,
  active,
  badge,
}: {
  label: string;
  icon: typeof Home;
  active?: boolean;
  badge?: string;
}) {
  return (
    <span
      className={`flex items-center gap-2.5 rounded-fx px-2.5 py-2 font-fx-text text-fx-small ${
        active ? 'bg-fx-emphasis font-bold text-fx-emphasis-ink' : 'font-medium text-fx-ink2'
      }`}
    >
      <Icon className={`size-4 ${active ? '' : 'text-fx-muted'}`} strokeWidth={active ? 2.2 : 1.9} />
      {label}
      {badge && (
        <span className="ml-auto rounded-full bg-fx-orange px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </span>
  );
}

function NavGroup({ label }: { label: string }) {
  return <p className="mt-5 mb-1.5 px-2.5 font-fx-display text-fx-label text-fx-muted uppercase">{label}</p>;
}

function Sidebar({ active }: { active: string }) {
  return (
    <div className="hidden w-52 shrink-0 flex-col border-r border-fx-line bg-fx-paper p-3 @2xl:flex">
      <span className="mb-6 px-2.5 pt-1 font-fx-display text-[17px] font-extrabold tracking-tight text-fx-ink">
        FABRIX
      </span>
      {NAV_GLOBAL.map((i) => <NavEntry key={i.label} {...i} active={i.label === active} />)}
      <NavGroup label="Maasstad Textiles" />
      {NAV_ORG.map((i) => <NavEntry key={i.label} {...i} active={i.label === active} />)}
      <div className="mt-5 border-t border-fx-line pt-3">
        <NavEntry label="Notifications" icon={Bell} badge="5" />
        <NavEntry label="Settings" icon={Settings} />
      </div>
    </div>
  );
}

// ── Screen 1 · Marketplace ──────────────────────────────────────────────
// The growth lever. Filter column, header, cards — the shape ExploreShell
// already renders, with the volume of the direction.

const FILTER_TYPES = [
  { label: 'Materials', on: true },
  { label: 'Capacities', on: true },
  { label: 'Services', on: false },
  { label: 'Products', on: false },
  { label: 'Distribution', on: false },
];

const LISTINGS: {
  title: string;
  desc: string;
  badge: string;
  bg: string;
  ink: string;
  org: string;
  initials: string;
  city: string;
  wanted?: boolean;
}[] = [
  {
    title: 'Woven cotton roll-ends, 2t / month',
    desc: 'Regular surplus from our weaving line — natural and dyed, sold by weight.',
    badge: 'Materials',
    bg: '--color-fx-green-soft',
    ink: '--color-fx-green',
    org: 'Maasstad Textiles',
    initials: 'MT',
    city: 'Rotterdam',
  },
  {
    title: 'Looking for post-consumer denim',
    desc: 'We take sorted denim from 200kg. Collection anywhere in the Benelux.',
    badge: 'Materials',
    bg: '--color-fx-green-soft',
    ink: '--color-fx-green',
    org: 'Renew Fibres',
    initials: 'RF',
    city: 'Antwerp',
    wanted: true,
  },
  {
    title: 'Mechanical recycling line — spare capacity',
    desc: '400t / year of tearing capacity available from October.',
    badge: 'Capacities',
    bg: '--color-fx-amber-soft',
    ink: '--color-fx-amber',
    org: 'Loop Recycling',
    initials: 'LR',
    city: 'Lille',
  },
  {
    title: 'Fibre composition testing',
    desc: 'NIR analysis and lab reports, 48h turnaround, samples by post.',
    badge: 'Services',
    bg: '--color-fx-teal-soft',
    ink: '--color-fx-teal',
    org: 'Textile Lab Ghent',
    initials: 'TG',
    city: 'Ghent',
  },
  {
    title: 'Upcycled workwear, small series',
    desc: 'Made from collected corporate uniforms. MOQ 50 pieces.',
    badge: 'Products',
    bg: '--color-fx-rose-soft',
    ink: '--color-fx-rose',
    org: 'Atelier Nord',
    initials: 'AN',
    city: 'Roubaix',
  },
  {
    title: 'Weekly collection round, Randstad',
    desc: 'Spare pallet space on an existing route. Rotterdam → Utrecht → Amsterdam.',
    badge: 'Distribution',
    bg: '--color-fx-indigo-soft',
    ink: '--color-fx-indigo',
    org: 'De Vries Logistiek',
    initials: 'DV',
    city: 'Utrecht',
  },
];

function ListingCard({ l }: { l: (typeof LISTINGS)[number] }) {
  return (
    <div className="overflow-hidden rounded-fx border border-fx-line bg-fx-paper">
      <div className="aspect-[16/9]" style={{ backgroundColor: `var(${l.bg})` }} />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center rounded-fx-sm px-2 py-0.5 font-fx-display text-[10px] uppercase"
            style={{ backgroundColor: `var(${l.bg})`, color: `var(${l.ink})` }}
          >
            {l.badge}
          </span>
          {l.wanted && (
            <span className="inline-flex items-center rounded-fx-sm bg-fx-orange px-2 py-0.5 font-fx-display text-[10px] text-white uppercase">
              Wanted
            </span>
          )}
        </div>
        <h4 className="mt-2.5 font-fx-display text-[15px] leading-snug font-bold text-fx-ink">{l.title}</h4>
        <p className="mt-1.5 text-fx-small text-fx-ink2">{l.desc}</p>
        <div className="mt-3.5 flex items-center gap-2 border-t border-fx-line pt-3.5">
          <span
            className="flex size-6 items-center justify-center rounded-fx-sm font-fx-display text-[9px] font-extrabold"
            style={{ backgroundColor: `var(${l.bg})`, color: `var(${l.ink})` }}
          >
            {l.initials}
          </span>
          <span className="truncate text-[11px] text-fx-ink2">{l.org}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-fx-muted">
            <MapPin className="size-3" /> {l.city}
          </span>
        </div>
      </div>
    </div>
  );
}

function Filters() {
  return (
    <div className="hidden w-56 shrink-0 space-y-6 border-r border-fx-line bg-fx-paper p-4 @4xl:block">
      <div className="flex items-center gap-2 rounded-fx border border-fx-line2 px-3 py-2">
        <Search className="size-3.5 text-fx-muted" />
        <span className="text-fx-small text-fx-muted">What you need or offer</span>
      </div>
      <div>
        <p className="mb-2.5 font-fx-display text-fx-label text-fx-muted uppercase">Type</p>
        <div className="space-y-2">
          {FILTER_TYPES.map((t) => (
            <span key={t.label} className="flex items-center gap-2.5 text-fx-small text-fx-ink2">
              <span
                className={`size-4 rounded-[5px] ${t.on ? 'bg-fx-emphasis' : 'border-2 border-fx-line2'}`}
              />
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2.5 font-fx-display text-fx-label text-fx-muted uppercase">Within</p>
        <div className="flex items-center gap-2 text-fx-small text-fx-ink2">
          <span className="relative h-1 flex-1 rounded-full bg-fx-line2">
            <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-fx-emphasis" />
            <span className="absolute -top-1.5 left-2/3 size-4 rounded-full border-2 border-fx-emphasis bg-fx-paper" />
          </span>
          <span className="font-bold text-fx-ink">200 km</span>
        </div>
        <p className="mt-2 text-[11px] text-fx-muted">of Rotterdam</p>
      </div>
    </div>
  );
}

export function MarketplaceScreen() {
  return (
    <ScreenFrame url="fabrixproject.eu/marketplace">
      <div className="flex bg-fx-panel">
        <Sidebar active="Marketplace" />
        <Filters />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 border-b border-fx-line bg-fx-paper px-5 py-3">
            <h3 className="font-fx-display text-fx-heading text-fx-ink">Marketplace</h3>
            <span className="text-fx-small text-fx-muted">128 listings</span>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded-fx-action bg-fx-emphasis px-3.5 py-2 font-fx-text text-fx-small font-bold text-fx-emphasis-ink"
            >
              <Plus className="size-3.5" strokeWidth={2.6} />
              Add a listing
            </button>
            <span className="flex items-center gap-0.5 rounded-fx-sm border border-fx-line2 p-0.5">
              <span className="rounded-[6px] bg-fx-emphasis p-1.5 text-fx-emphasis-ink">
                <LayoutGrid className="size-3.5" />
              </span>
              <span className="p-1.5 text-fx-muted">
                <List className="size-3.5" />
              </span>
              <span className="p-1.5 text-fx-muted">
                <Map className="size-3.5" />
              </span>
            </span>
          </div>
          <div className="grid gap-4 p-5 @lg:grid-cols-2 @6xl:grid-cols-3">
            {LISTINGS.map((l) => <ListingCard key={l.title} l={l} />)}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

// ── Screen 2 · Home ─────────────────────────────────────────────────────
// Where the referral loop is asked for: the invite block is the largest
// thing on the page, and the counter next to it is the point of the loop.

const ACTIVITY = [
  { who: 'Renew Fibres', what: 'posted a listing — Looking for post-consumer denim', when: '2h', bg: '--color-fx-green-soft', ink: '--color-fx-green', initials: 'RF' },
  { who: 'Textile Lab Ghent', what: 'accepted your connection request', when: '5h', bg: '--color-fx-teal-soft', ink: '--color-fx-teal', initials: 'TG' },
  { who: 'Atelier Nord', what: 'claimed the profile you added', when: 'yesterday', bg: '--color-fx-rose-soft', ink: '--color-fx-rose', initials: 'AN' },
];

export function HomeScreen() {
  return (
    <ScreenFrame url="fabrixproject.eu/maasstad-textiles/dashboard">
      <div className="flex bg-fx-panel">
        <Sidebar active="Home" />
        <div className="min-w-0 flex-1 p-6 @2xl:p-8">
          <p className="font-fx-display text-fx-label text-fx-muted uppercase">Maasstad Textiles</p>
          <h3 className="mt-3 max-w-xl font-fx-display text-fx-display text-fx-ink">Good morning, Thomas.</h3>
          <p className="mt-3 max-w-lg text-fx-body text-fx-ink2">
            Three organisations you work with are not on Fabrix yet. Adding them keeps your value chain honest — and
            invites them in.
          </p>

          <div className="mt-7 grid gap-4 @3xl:grid-cols-3">
            <div className="rounded-fx-lg bg-fx-emphasis p-5 text-fx-emphasis-ink @3xl:col-span-2">
              <span className="font-fx-display text-fx-label uppercase opacity-70">The loop</span>
              <p className="mt-3 max-w-sm font-fx-display text-fx-title">
                Add the partners you already work with.
              </p>
              <p className="mt-2 max-w-sm text-fx-small opacity-85">
                Suppliers, clients, collectors. They appear on your profile straight away, and get invited to claim
                theirs.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 rounded-fx-action bg-fx-emphasis-ink px-4 py-2.5 font-fx-text text-fx-small font-bold text-fx-emphasis"
              >
                <Plus className="size-4" strokeWidth={2.6} />
                Add a partner
              </button>
            </div>
            <div className="rounded-fx-lg border border-fx-line bg-fx-paper p-5">
              <span className="font-fx-display text-fx-label text-fx-muted uppercase">This month</span>
              <p className="mt-3 font-fx-display text-fx-display text-fx-ink">47</p>
              <p className="mt-1 text-fx-small text-fx-ink2">partners invited across the network</p>
              <p className="mt-4 flex items-center gap-1.5 border-t border-fx-line pt-4 text-fx-small font-bold text-fx-emphasis">
                Yours: 3 invited, 1 joined
                <ArrowUpRight className="size-3.5" strokeWidth={2.4} />
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-fx-lg border border-fx-line bg-fx-paper p-5">
            <div className="flex items-baseline justify-between">
              <h4 className="font-fx-display text-fx-heading text-fx-ink">Around you</h4>
              <span className="text-fx-small font-bold text-fx-emphasis">See all</span>
            </div>
            <div className="mt-1">
              {ACTIVITY.map((a) => (
                <div key={a.who} className="flex items-center gap-3 border-t border-fx-line py-3.5 first:border-t-0">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-fx-sm font-fx-display text-[11px] font-extrabold"
                    style={{ backgroundColor: `var(${a.bg})`, color: `var(${a.ink})` }}
                  >
                    {a.initials}
                  </span>
                  <p className="min-w-0 truncate text-fx-small text-fx-ink2">
                    <span className="font-bold text-fx-ink">{a.who}</span> {a.what}
                  </p>
                  <span className="ml-auto shrink-0 text-[11px] text-fx-muted">{a.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
