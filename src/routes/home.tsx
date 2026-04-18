import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, isAuthenticated, type MeOrganization, type AccessibleCommunity } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';
import { PendingActions } from '../components/PendingActions';
import {
  Building2,
  Users,
  MapPin,
  Network,
  TrendingUp,
  Recycle,
  ArrowRight,
  Info,
} from 'lucide-react';

function OrgCard({ org }: { org: MeOrganization }) {
  const kind = org.organization_kind ? ORG_KINDS[org.organization_kind] : null;
  const initials = org.organization_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to="/$orgSlug/dashboard"
      params={{ orgSlug: org.organization_slug }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {org.organization_image_url ? (
            <img
              src={org.organization_image_url}
              alt={org.organization_name}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-gray-900 truncate">
                {org.organization_name}
              </h3>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {kind && (
              <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full mt-1 ${kind.badgeColor}`}>
                {kind.label}
              </span>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{org.relations_count} relations</span>
              <span>{org.assessments_completed}/{org.assessments_total} assessments</span>
              <span>{org.communities.length} communities</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommunityCard({ community, orgSlug }: { community: AccessibleCommunity; orgSlug?: string }) {
  const initials = community.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const linkProps = orgSlug
    ? { to: '/$orgSlug/communities/$communitySlug' as const, params: { orgSlug, communitySlug: community.slug } }
    : { to: '/communities' as const, params: {} };

  return (
    <Link
      {...linkProps}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4 flex items-center gap-3">
        {community.image_url ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
            {community.name}
          </h3>
        </div>
        <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex-shrink-0">
          Admin
        </span>
        <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

function PersonaCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  features,
  buttonLabel,
  buttonTo,
  hoverBorder,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  buttonLabel: string;
  buttonTo: string;
  hoverBorder: string;
}) {
  return (
    <div className={`border border-gray-200 rounded-lg bg-white row-span-3 grid grid-rows-subgrid gap-0 transition-all hover:shadow-lg ${hoverBorder}`}>
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
          <h3 className="font-display text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="px-6 py-2">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">FABRIX helps you:</h4>
        <ul className="space-y-1.5">
          {features.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className={`shrink-0 mt-0.5 ${iconColor}`}>{f.icon}</span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 pt-4">
        <Link
          to={buttonTo}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          {buttonLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b bg-white"
        style={{
          backgroundImage: "url('/header_background.png')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4 text-white">
              Map, match, make
            </h1>
            <p className="text-lg md:text-xl mb-10 text-white/90 leading-relaxed max-w-2xl mx-auto">
              FABRIX connects organizations and facilitators in the textile and clothing industry
              to build local, circular, and sustainable supply chains.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-white/60 text-sm font-medium rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Three Personas Section */}
      <section id="registration-cards" className="container mx-auto px-4 py-14 md:py-20">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">
          Who is FABRIX for?
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <PersonaCard
            icon={<Building2 className="h-5 w-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            title="Organizations"
            description="I'm part of an organisation or business (Small-Medium Enterprise, Micro-business, independent designer/producer, consultant etc.)"
            features={[
              { icon: <TrendingUp className="h-4 w-4" />, text: 'Measure and improve your level of environmental and social sustainability' },
              { icon: <MapPin className="h-4 w-4" />, text: 'Map and Match to find nearby supply chain collaborators' },
              { icon: <Recycle className="h-4 w-4" />, text: 'Make your business more local, circular and meaningful' },
            ]}
            buttonLabel="Sign Up as an Organisation"
            buttonTo="/register-with-org"
            hoverBorder="hover:border-purple-200"
          />

          <PersonaCard
            icon={<Users className="h-5 w-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            title="Facilitators"
            description="I lead a community (through an incubator, co-working, lab, trade association, union, public authority etc.)"
            features={[
              { icon: <MapPin className="h-4 w-4" />, text: 'Map and manage your community' },
              { icon: <Network className="h-4 w-4" />, text: 'Match members to develop meaningful partnerships' },
              { icon: <TrendingUp className="h-4 w-4" />, text: 'Measure the connections you create' },
              { icon: <Recycle className="h-4 w-4" />, text: 'Make your local economy more circular' },
            ]}
            buttonLabel="Sign Up as a Facilitator"
            buttonTo="/register-facilitator"
            hoverBorder="hover:border-blue-200"
          />

          <PersonaCard
            icon={<Info className="h-5 w-5" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            title="Viewers"
            description="I want to explore the platform and learn about sustainable textile networks"
            features={[
              { icon: <MapPin className="h-4 w-4" />, text: 'Browse and explore the textile network' },
              { icon: <Network className="h-4 w-4" />, text: 'Discover sustainable organizations and communities' },
              { icon: <TrendingUp className="h-4 w-4" />, text: 'Learn about circular economy initiatives' },
              { icon: <Recycle className="h-4 w-4" />, text: 'Stay informed about industry developments' },
            ]}
            buttonLabel="Sign Up as a Viewer"
            buttonTo="/register-basic"
            hoverBorder="hover:border-green-200"
          />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <a
            href="https://platform.fabrixproject.eu/doc/roles"
            className="hover:text-purple-600 underline transition-colors"
          >
            Learn more about roles here
          </a>
        </p>
      </section>

      {/* Beta Notice */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto border border-blue-200 bg-blue-50/50 rounded-lg p-6">
          <div className="flex gap-4">
            <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="font-display font-semibold">Beta Testing Mode</h3>
              <p className="text-sm text-muted-foreground">
                The FABRIX PLATFORM is currently in beta testing mode. We're focusing on the
                Textile and Clothing (fashion) industry in two pilot cities, <strong>Rotterdam (NL)</strong> and{' '}
                <strong>Athens (GR)</strong>. In the future, service will expand to include other regions
                and industries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About FABRIX Section */}
      <section className="border-t bg-slate-50">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">About FABRIX</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                FABRIX is a European Union funded project that studies how we can encourage
                sustainable urban manufacturing. First, mapping instances of the T&C industry in
                cities, we can see where manufacturing takes place and trends over time.
              </p>
              <p>
                Then, working with local administrations, urban planners, and figures we call
                &quot;Facilitators&quot;, we see if we can help businesses overcome difficulties - often
                related to space or human relations - through the auxiliary of a digital platform.
              </p>
              <p>
                We imagine a city in which fashion is local and meaningful, creating connections
                and expressing identity. Where fast fashion is out of fashion, and waste is a
                resource that is utilized.
              </p>
              <p>
                To reach this goal we seek gamechangers who want to collaborate to{' '}
                <strong>&quot;map, match and make&quot;</strong> something innovative and beautiful.
              </p>
            </div>
            <a
              href="https://www.fabrixproject.eu/about"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Read More About FABRIX
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-10 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
              <div>
                <div className="mb-2">
                  <img
                    src="/fabrix-logo.svg"
                    alt="FABRIX"
                    className="h-8 w-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  Fostering sustainable urban manufacturing in textile and clothing ecosystems
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div>
                  <h4 className="font-semibold mb-3">Quick Links</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="https://www.fabrixproject.eu/about" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">About</a></li>
                    <li><Link to="/communities" className="hover:text-primary transition-colors">Communities</Link></li>
                    <li><a href="https://www.fabrixproject.eu/news" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">News</a></li>
                    <li><a href="https://www.fabrixproject.eu/contact" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Contact</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="https://www.fabrixproject.eu/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="https://www.fabrixproject.eu/privacy-policy/cookies" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        Cookies Policy
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Pilot Cities</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Rotterdam, Netherlands</li>
                    <li>Athens, Greece</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Flag_of_Europe.svg"
                    alt="EU Flag"
                    className="w-12 h-8 object-contain"
                  />
                  <p className="text-xs text-muted-foreground max-w-md">
                    This project has received funding from the European Union&apos;s Horizon 2020 research and innovation programme.
                  </p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3">
                  <div className="flex items-center gap-4">
                    <a href="https://www.linkedin.com/company/101634457/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <a href="https://www.facebook.com/fabrixproject" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="https://www.instagram.com/fabrixproject/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.882 0 1.441 1.441 0 0 1 2.882 0z"/></svg>
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    &copy; 2025 FABRIX. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function HomePage() {
  const authed = isAuthenticated();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: authed,
  });

  if (!authed) {
    return <LandingPage />;
  }

  if (me.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (me.error) {
    return <div className="p-6 text-red-600">Failed to load user</div>;
  }

  const user = me.data!;
  const orgs = user.organizations ?? [];
  const adminCommunities = (user.accessible_communities ?? []).filter((c) => c.is_admin);
  const firstOrgSlug = orgs[0]?.organization_slug;
  const isViewer = orgs.length === 0 && adminCommunities.length === 0;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isViewer
            ? 'Explore the directory and map to discover organizations.'
            : 'Select an organization to view its dashboard.'}
        </p>
      </div>

      <PendingActions />

      {adminCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold text-gray-900">Your communities</h2>
          <p className="text-sm text-gray-500 mt-1 mb-3">Communities you manage as a facilitator</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adminCommunities.map((c) => (
              <CommunityCard key={c.id} community={c} orgSlug={firstOrgSlug} />
            ))}
          </div>
        </div>
      )}

      {orgs.length > 0 ? (
        <div>
          {adminCommunities.length > 0 && (
            <>
              <h2 className="text-lg font-display font-semibold text-gray-900">Your organizations</h2>
              <p className="text-sm text-gray-500 mt-1 mb-3">Organizations you are a member of</p>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((org) => (
              <OrgCard key={org.organization_id} org={org} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <div className="max-w-sm mx-auto">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <h3 className="font-display font-semibold text-gray-900 mb-2">
              Add your organization
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Search for your organization in our directory or create a new one to get started.
            </p>
            <Link
              to="/organizations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Organization
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
