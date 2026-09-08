import type { ReactNode } from 'react';
import {
  Avatars,
  Badges,
  Banners,
  Buttons,
  Cards,
  EmptyState,
  Fields,
  NavItems,
  Pills,
  Row,
  Tabs,
  Toggles,
} from '../components/design/atoms';
import { HomeScreen, MarketplaceScreen } from '../components/design/screens';
import { OrgProfileScreen } from '../components/design/screen-profile';
import { SpacingRules } from '../components/design/spacing';

/**
 * /design — the design system, rendered from the live tokens rather than
 * pictured. The second candidate direction was dropped once this one was
 * chosen; what it leaves behind is the discipline it forced — every atom
 * below is written against token names, never their values.
 */

const META = {
  label: 'The FABRIX design system · live on the Learning Hub',
  title: 'This is the system.',
  lede:
    "Everything structural is the prototype's: white page, #faf9fc panel, Plus Jakarta Sans, violet #6c4cf1, the same accents, 14px cards. What changed is volume — headings four times the size at weight 800, solid violet where it used a tint. The Learning Hub runs on it since September 2026; the platform's own screens migrate one at a time.",
  chips: ['Plus Jakarta Sans 800', 'Violet #6c4cf1', 'Panel #faf9fc', '14px cards', 'Fills, not tints'],
};

const SWATCHES: { group: string; items: { name: string; token: string; note?: string }[] }[] = [
  {
    group: 'Ground & ink',
    items: [
      { name: 'ground', token: '--color-fx-ground', note: 'page' },
      { name: 'panel', token: '--color-fx-panel', note: 'content area' },
      { name: 'paper', token: '--color-fx-paper', note: 'cards' },
      { name: 'ink', token: '--color-fx-ink' },
      { name: 'ink2', token: '--color-fx-ink2' },
      { name: 'muted', token: '--color-fx-muted' },
      { name: 'line', token: '--color-fx-line' },
      { name: 'line2', token: '--color-fx-line2' },
    ],
  },
  {
    group: 'Emphasis',
    items: [
      { name: 'emphasis', token: '--color-fx-emphasis', note: 'selected, primary, hero' },
      { name: 'emphasis-ink', token: '--color-fx-emphasis-ink', note: 'text on it' },
      { name: 'emphasis-soft', token: '--color-fx-emphasis-soft' },
      { name: 'violet', token: '--color-fx-violet' },
      { name: 'violet-soft', token: '--color-fx-violet-soft' },
      { name: 'violet-border', token: '--color-fx-violet-border' },
    ],
  },
  {
    group: 'Accents',
    items: [
      { name: 'teal', token: '--color-fx-teal' },
      { name: 'green', token: '--color-fx-green' },
      { name: 'amber', token: '--color-fx-amber' },
      { name: 'rose', token: '--color-fx-rose' },
      { name: 'indigo', token: '--color-fx-indigo' },
      { name: 'orange', token: '--color-fx-orange', note: 'needs, urgency' },
    ],
  },
  {
    group: 'Soft fills',
    items: [
      { name: 'teal-soft', token: '--color-fx-teal-soft' },
      { name: 'green-soft', token: '--color-fx-green-soft' },
      { name: 'amber-soft', token: '--color-fx-amber-soft' },
      { name: 'rose-soft', token: '--color-fx-rose-soft' },
      { name: 'indigo-soft', token: '--color-fx-indigo-soft' },
      { name: 'slate-soft', token: '--color-fx-slate-soft' },
    ],
  },
];

const TYPE_SPECS = [
  { cls: 'text-fx-hero', name: 'hero', sample: 'Circular textile, connected' },
  { cls: 'text-fx-display', name: 'display', sample: 'Find what you need nearby' },
  { cls: 'text-fx-title', name: 'title', sample: 'Maasstad Textiles' },
  { cls: 'text-fx-heading', name: 'heading', sample: 'Woven cotton roll-ends' },
];

const RADII = [
  { name: 'fx-sm', cls: 'rounded-fx-sm' },
  { name: 'fx', cls: 'rounded-fx' },
  { name: 'fx-lg', cls: 'rounded-fx-lg' },
  { name: 'fx-xl', cls: 'rounded-fx-xl' },
  { name: 'fx-action', cls: 'rounded-fx-action' },
];

function Section({ n, title, lede, children }: { n: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section className="mt-20 first:mt-0">
      <div className="flex items-baseline gap-4">
        <span className="font-fx-display text-fx-label text-fx-muted uppercase">{n}</span>
        <h2 className="font-fx-display text-fx-title text-fx-ink">{title}</h2>
      </div>
      {lede && <p className="mt-3 max-w-2xl text-fx-lead text-fx-ink2">{lede}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Reads the resolved value so the page can print what it is actually rendering. */
function Swatch({ name, token, note }: { name: string; token: string; note?: string }) {
  return (
    <div>
      <div className="h-20 rounded-fx border border-fx-line" style={{ backgroundColor: `var(${token})` }} />
      <p className="mt-2 font-fx-text text-fx-small font-bold text-fx-ink">{name}</p>
      {note && <p className="mt-0.5 text-[11px] text-fx-muted italic">{note}</p>}
    </div>
  );
}

export function DesignPage() {
  return (
    <div className="min-h-screen bg-fx-ground font-fx-text text-fx-ink">
      <header className="border-b border-fx-line px-8 py-14 sm:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-fx-display text-fx-label text-fx-muted uppercase">{META.label}</p>
          <h1 className="mt-8 max-w-4xl font-fx-display text-fx-hero text-fx-ink">{META.title}</h1>
          <p className="mt-6 max-w-2xl text-fx-lead text-fx-ink2">{META.lede}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {META.chips.map((c) => (
              <span
                key={c}
                className="rounded-full bg-fx-emphasis-soft px-4 py-2 font-fx-text text-fx-small font-bold text-fx-ink"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="bg-fx-panel">
        <div className="mx-auto max-w-6xl px-8 py-20 sm:px-16">
          <Section
            n="01"
            title="Colour"
            lede="One name does one job. `emphasis` is the colour that carries the structural work, and every selected state, primary button and hero block reads from it — no screen names violet directly."
          >
            <div className="grid gap-12">
              {SWATCHES.map((g) => (
                <div key={g.group}>
                  <h3 className="mb-4 font-fx-display text-fx-heading text-fx-ink">{g.group}</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                    {g.items.map((s) => <Swatch key={s.token} {...s} />)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            n="02"
            title="Type"
            lede="The prototype tops out at a 23px heading — that one number is most of why it reads timid. The sizes below are the intervention; the body scale is unchanged, because it was never the problem."
          >
            <div className="rounded-fx-lg border border-fx-line bg-fx-paper p-8">
              {TYPE_SPECS.map((t) => (
                <div key={t.name} className="border-t border-fx-line py-6 first:border-t-0 first:pt-0">
                  <span className="mb-3 block font-fx-text text-fx-small font-bold text-fx-muted">{t.name}</span>
                  <p className={`font-fx-display ${t.cls} text-fx-ink`}>{t.sample}</p>
                </div>
              ))}
              <div className="border-t border-fx-line pt-6">
                <span className="mb-3 block font-fx-text text-fx-small font-bold text-fx-muted">
                  lead / body / small / label
                </span>
                <p className="max-w-2xl text-fx-lead text-fx-ink2">Lead. Once at the top of a page, to say what it is for.</p>
                <p className="mt-3 max-w-2xl text-fx-body text-fx-ink2">
                  Body. The default — descriptions, form help, card copy.
                </p>
                <p className="mt-3 text-fx-small text-fx-muted">Small. Metadata, counts, timestamps.</p>
                <p className="mt-3 font-fx-display text-fx-label text-fx-muted uppercase">Label — uppercase, tracked out</p>
              </div>
            </div>
          </Section>

          <Section
            n="03"
            title="Radius"
            lede="Cards keep the prototype's 14. The larger steps are for hero surfaces, and actions get their own token, so a button's shape moves without touching a button."
          >
            <div className="flex flex-wrap gap-6">
              {RADII.map((r) => (
                <div key={r.name}>
                  <div className={`size-28 border-2 border-fx-emphasis bg-fx-paper ${r.cls}`} />
                  <p className="mt-2 font-fx-text text-fx-small font-bold">{r.name}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            n="04"
            title="Spacing"
            lede="Type sizes without spacing rules is half a system — the Learning Hub migration proved it by breaking all three of these at once. Each rule below is shown as the before/after it actually was."
          >
            <SpacingRules />
          </Section>

          <Section
            n="05"
            title="Atoms"
            lede="The pieces every screen is assembled from, written once against the token names. Move a value in index.css and every one of them follows."
          >
            <div className="rounded-fx-lg border border-fx-line bg-fx-paper px-8 py-2">
              <Row label="Buttons" hint="primary is the emphasis colour · shape comes from --radius-fx-action"><Buttons /></Row>
              <Row label="Filter pills" hint="selected is a solid fill, not a tint"><Pills /></Row>
              <Row label="Badges" hint="listing types and states"><Badges /></Row>
              <Row label="Fields"><Fields /></Row>
              <Row label="Switches"><Toggles /></Row>
              <Row label="Identity" hint="organisations are squares, people are circles"><Avatars /></Row>
              <Row label="Navigation" hint="the active entry is filled, not tinted"><NavItems /></Row>
              <Row label="Tabs"><Tabs /></Row>
              <Row label="Cards" hint="the middle one is the surface the prototype never had"><Cards /></Row>
              <Row label="Banners"><Banners /></Row>
              <Row label="Empty state"><EmptyState /></Row>
            </div>
          </Section>

          <Section
            n="06"
            title="Screens"
            lede="The atoms put back in the shape the app already has — the flat sidebar, the filter column, the card grid. Nothing here is drawn twice; the screens are the same pieces, arranged."
          >
            <div className="grid gap-8">
              <div>
                <p className="mb-3 font-fx-display text-fx-label text-fx-muted uppercase">
                  Marketplace — the growth lever
                </p>
                <MarketplaceScreen />
              </div>
              <div>
                <p className="mb-3 font-fx-display text-fx-label text-fx-muted uppercase">
                  Home — where the referral loop is asked for
                </p>
                <HomeScreen />
              </div>
              <div>
                <p className="mb-3 font-fx-display text-fx-label text-fx-muted uppercase">
                  Organisation profile — what an invited partner lands on
                </p>
                <OrgProfileScreen />
              </div>
            </div>
          </Section>

          <footer className="mt-24 border-t border-fx-line pt-8">
            <p className="max-w-3xl text-fx-small text-fx-muted">
              The system lives in <span className="font-mono text-fx-ink">src/index.css</span> as one set of{' '}
              <span className="font-mono text-fx-ink">fx-*</span> names. The Learning Hub already runs on it; this app
              still renders on the previous tokens — no existing screen changes until it is migrated on purpose. Plus
              Jakarta Sans is self-hosted in{' '}
              <span className="font-mono text-fx-ink">public/fonts</span>; no third-party font call.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
