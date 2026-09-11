import type { ReactNode } from 'react';
import {
  ArrowRight,
  Building2,
  Compass,
  MapPin,
  Network,
  Recycle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ScreenFrame } from './screens';

/* Screen 4 · The landing page — the only screen here a logged-out visitor
   sees, and the top of the funnel. Content is the one that ships today
   (hero, three audiences, pilot notice, about); what changes is the volume. */

const AUDIENCES: {
  icon: typeof Building2;
  bg: string;
  ink: string;
  title: string;
  blurb: string;
  points: { icon: typeof MapPin; text: string }[];
  cta: string;
}[] = [
  {
    icon: Building2,
    bg: '--color-fx-violet-soft',
    ink: '--color-fx-violet',
    title: 'Organisations',
    blurb: 'An SME, a micro-business, an independent designer or producer, a consultant.',
    points: [
      { icon: TrendingUp, text: 'Measure your environmental and social practices' },
      { icon: MapPin, text: 'Find supply-chain partners nearby' },
      { icon: Recycle, text: 'Make your business local and circular' },
    ],
    cta: 'Sign up as an organisation',
  },
  {
    icon: Users,
    bg: '--color-fx-teal-soft',
    ink: '--color-fx-teal',
    title: 'Facilitators',
    blurb: 'An incubator, a co-working space, a lab, a trade association, a public authority.',
    points: [
      { icon: MapPin, text: 'Map and manage your network' },
      { icon: Network, text: 'Match members into real partnerships' },
      { icon: TrendingUp, text: 'Measure the connections you create' },
    ],
    cta: 'Sign up as a facilitator',
  },
  {
    icon: Compass,
    bg: '--color-fx-green-soft',
    ink: '--color-fx-green',
    title: 'Viewers',
    blurb: 'Anyone who wants to explore the ecosystem before taking part in it.',
    points: [
      { icon: MapPin, text: 'Browse the directory and the map' },
      { icon: Network, text: 'Discover organisations and initiatives' },
      { icon: Recycle, text: 'Follow what the pilot cities are doing' },
    ],
    cta: 'Sign up as a viewer',
  },
];

function Section({ children, tone = 'panel' }: { children: ReactNode; tone?: 'panel' | 'paper' }) {
  return (
    <section className={tone === 'paper' ? 'bg-fx-paper' : 'bg-fx-panel'}>
      <div className="mx-auto max-w-4xl px-6 py-12 @2xl:px-10 @2xl:py-16">{children}</div>
    </section>
  );
}

export function LandingScreen() {
  return (
    <ScreenFrame url="fabrixproject.eu">
      {/* Logged out: no sidebar, and the only two things to do are sign in
          or start. */}
      <div className="flex items-center gap-4 border-b border-fx-line bg-fx-paper px-6 py-3.5">
        <span className="font-fx-display text-[17px] font-extrabold tracking-tight text-fx-ink">FABRIX</span>
        <span className="ml-auto font-fx-text text-fx-small font-bold text-fx-ink2">Sign in</span>
        <button
          type="button"
          className="rounded-fx-action bg-fx-emphasis px-4 py-2 font-fx-text text-fx-small font-bold text-fx-emphasis-ink"
        >
          Get started
        </button>
      </div>

      {/* The hero is the brand block at full strength — the one place the
          violet gets a whole screen rather than a button. */}
      <div className="bg-fx-emphasis px-6 py-16 text-fx-emphasis-ink @2xl:px-10 @2xl:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="font-fx-display text-fx-label uppercase opacity-70">
            Funded by the European Union · piloting in Rotterdam &amp; Athens
          </p>
          <h3 className="mt-6 max-w-[14ch] font-fx-display text-fx-hero">Map, match, make.</h3>
          <p className="mt-6 max-w-xl text-fx-lead opacity-90">
            FABRIX connects the organisations and facilitators of the textile and clothing industry, so that
            supply chains can be rebuilt locally, circularly, city by city.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-fx-action bg-fx-emphasis-ink px-5 py-3 font-fx-text text-fx-body font-bold text-fx-emphasis"
            >
              Get started
              <ArrowRight className="size-4" strokeWidth={2.6} />
            </button>
            <button
              type="button"
              className="rounded-fx-action border-2 border-white/45 px-5 py-3 font-fx-text text-fx-body font-bold"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <Section>
        <h4 className="font-fx-display text-fx-display text-fx-ink">Who is FABRIX for?</h4>
        <div className="mt-9 grid gap-4 @3xl:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="flex flex-col rounded-fx-lg border border-fx-line bg-fx-paper p-5">
              <span
                className="flex size-11 items-center justify-center rounded-fx"
                style={{ backgroundColor: `var(${a.bg})`, color: `var(${a.ink})` }}
              >
                <a.icon className="size-5" strokeWidth={2.1} />
              </span>
              <h5 className="mt-4 font-fx-display text-fx-heading text-fx-ink">{a.title}</h5>
              <p className="mt-2 text-fx-small text-fx-ink2">{a.blurb}</p>
              <div className="mt-4 mb-5 grid gap-2.5 border-t border-fx-line pt-4">
                {a.points.map((p) => (
                  <span key={p.text} className="flex items-start gap-2 text-fx-small text-fx-ink2">
                    <p.icon className="mt-0.5 size-3.5 shrink-0 text-fx-muted" />
                    {p.text}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="mt-auto rounded-fx-action bg-fx-emphasis px-4 py-2.5 font-fx-text text-fx-small font-bold text-fx-emphasis-ink"
              >
                {a.cta}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="paper">
        <div className="flex flex-wrap items-center gap-4 rounded-fx-lg bg-fx-amber-soft px-5 py-4">
          <span className="font-fx-display text-fx-label text-fx-amber uppercase">Beta</span>
          <p className="max-w-xl text-fx-body text-fx-ink">
            FABRIX is piloting in two cities — Rotterdam and Athens — with the textile and clothing
            industry. Other regions and industries follow.
          </p>
        </div>

        <div className="mt-12 grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h4 className="font-fx-display text-fx-title text-fx-ink">About FABRIX</h4>
            <p className="mt-4 max-w-prose text-fx-body text-fx-ink2">
              A European Union funded project studying how to encourage sustainable urban manufacturing.
              We map where textile production actually happens in cities, then work with local
              administrations, urban planners and facilitators to help businesses get past what blocks
              them.
            </p>
            <p className="mt-3 max-w-prose text-fx-body text-fx-ink2">
              We imagine a city where fashion is local and meaningful, where fast fashion is out of
              fashion, and where waste is a resource.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-fx-action border border-fx-line2 px-4 py-2.5 font-fx-text text-fx-small font-bold text-fx-ink"
            >
              Read more about FABRIX
              <ArrowRight className="size-3.5" strokeWidth={2.4} />
            </button>
          </div>

          <div className="self-start rounded-fx-lg bg-fx-panel p-5">
            <span className="flex h-8 w-12 items-center justify-center rounded-[3px] bg-fx-indigo text-[10px] font-bold text-white">
              EU
            </span>
            <p className="mt-3 text-fx-small font-bold text-fx-ink">Funded by the European Union</p>
            <p className="mt-2 text-[11px] leading-relaxed text-fx-muted">
              Horizon Europe Programme, grant agreement No. 101135638. Views and opinions expressed are
              those of the authors only.
            </p>
          </div>
        </div>
      </Section>
    </ScreenFrame>
  );
}
