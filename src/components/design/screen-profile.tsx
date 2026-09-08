import {
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Plus,
  Users,
} from 'lucide-react';
import { ScreenFrame, Sidebar } from './screens';

/* Screen 3 · An organisation's public profile — what a partner lands on when
   a member adds and invites them, and where the connect / claim decision is
   taken. Same rule as the other screens: tokens only, nothing fetched. */

const LISTINGS: { title: string; badge: string; bg: string; ink: string; wanted?: boolean }[] = [
  {
    title: 'Looking for post-consumer denim, from 200kg',
    badge: 'Materials',
    bg: '--color-fx-green-soft',
    ink: '--color-fx-green',
    wanted: true,
  },
  {
    title: 'Mechanical tearing line — 400t / year available',
    badge: 'Capacities',
    bg: '--color-fx-amber-soft',
    ink: '--color-fx-amber',
  },
];

const RELATED = [
  // The viewer's own organisation sits in this list: on a partner's profile,
  // the value chain is the thing you recognise yourself in.
  { name: 'Maasstad Textiles', role: 'Supplier', initials: 'MT', bg: '--color-fx-teal-soft', ink: '--color-fx-teal' },
  { name: 'Atelier Nord', role: 'Client', initials: 'AN', bg: '--color-fx-rose-soft', ink: '--color-fx-rose' },
  { name: 'De Vries Logistiek', role: 'Services', initials: 'DV', bg: '--color-fx-indigo-soft', ink: '--color-fx-indigo' },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-fx border border-fx-line bg-fx-paper p-5">
      <h4 className="font-fx-display text-fx-heading text-fx-ink">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OrgProfileScreen() {
  return (
    <ScreenFrame url="fabrixproject.eu/organizations/renew-fibres">
      <div className="flex bg-fx-panel">
        <Sidebar active="Directory" />

        <div className="min-w-0 flex-1 pb-8">
          {/* Cover. A brand block, not a grey rectangle: most organisations
              have no cover photo, and that state deserves a design too. */}
          <div className="h-32 bg-fx-emphasis" />

          <div className="px-6 @2xl:px-8">
            {/* The avatar breaks the cover line — organisations are squares. */}
            <div className="-mt-10 flex size-20 items-center justify-center rounded-fx-lg border-4 border-fx-panel bg-fx-green font-fx-display text-[24px] font-extrabold text-white">
              RF
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-fx-display text-fx-title text-fx-ink">Renew Fibres</h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-fx-small text-fx-ink2">
                  <span
                    className="inline-flex items-center rounded-fx-sm px-2.5 py-1 font-fx-display text-fx-label uppercase"
                    style={{
                      backgroundColor: 'var(--color-fx-teal-soft)',
                      color: 'var(--color-fx-teal)',
                    }}
                  >
                    Recycler
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-fx-muted" /> Antwerp, BE
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-fx-muted" /> 62 workers
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-fx-action bg-fx-emphasis px-4 py-2.5 font-fx-text text-fx-small font-bold text-fx-emphasis-ink"
                >
                  <Plus className="size-3.5" strokeWidth={2.6} />
                  Connect
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-fx-action border border-fx-line2 bg-fx-paper px-4 py-2.5 font-fx-text text-fx-small font-bold text-fx-ink2"
                >
                  <MessageSquare className="size-3.5" strokeWidth={2.2} />
                  Message
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="grid gap-4">
                <Card title="About">
                  <p className="max-w-prose text-fx-body text-fx-ink2">
                    Mechanical recycler on the Scheldt, turning sorted post-consumer textile back into
                    spinnable fibre. We collect anywhere in the Benelux from 200kg, and publish what we can
                    take each month.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 border-t border-fx-line pt-4 text-fx-small font-bold text-fx-emphasis">
                    <span className="flex items-center gap-1.5">
                      <Globe className="size-3.5" /> renewfibres.be
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> intake@renewfibres.be
                    </span>
                  </div>
                </Card>

                <Card title="Listings">
                  <div className="grid gap-3 @2xl:grid-cols-2">
                    {LISTINGS.map((l) => (
                      <div key={l.title} className="overflow-hidden rounded-fx border border-fx-line">
                        <div className="aspect-[16/7]" style={{ backgroundColor: `var(${l.bg})` }} />
                        <div className="p-3.5">
                          <span className="flex flex-wrap items-center gap-1.5">
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
                          </span>
                          <p className="mt-2 font-fx-display text-[14px] leading-snug font-bold text-fx-ink">
                            {l.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid content-start gap-4">
                {/* The referral loop, on someone else's profile: the value
                    chain is public, and every row is an invitation waiting. */}
                <section className="rounded-fx border border-fx-line bg-fx-paper p-5">
                  <div className="flex items-baseline justify-between">
                    <h4 className="font-fx-display text-fx-heading text-fx-ink">Works with</h4>
                    <Network className="size-4 text-fx-muted" />
                  </div>
                  <div className="mt-1">
                    {RELATED.map((r) => (
                      <div key={r.name} className="flex items-center gap-2.5 border-t border-fx-line py-3 first:border-t-0">
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-fx-sm font-fx-display text-[10px] font-extrabold"
                          style={{ backgroundColor: `var(${r.bg})`, color: `var(${r.ink})` }}
                        >
                          {r.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-fx-small font-bold text-fx-ink">{r.name}</span>
                          <span className="block text-[11px] text-fx-muted">{r.role}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-fx border border-fx-line bg-fx-paper p-5">
                  <h4 className="font-fx-display text-fx-heading text-fx-ink">Photos</h4>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      '--color-fx-teal-soft',
                      '--color-fx-slate-soft',
                      '--color-fx-green-soft',
                      '--color-fx-amber-soft',
                    ].map((c) => (
                      <span key={c} className="aspect-square rounded-fx-sm" style={{ backgroundColor: `var(${c})` }} />
                    ))}
                  </div>
                </section>

              </div>
            </div>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
