import { Link } from '@tanstack/react-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getMe, isAuthenticated, type MeOrganization } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';
import { PendingActions } from '../components/PendingActions';
import { getUserFeed } from '../lib/feed';
import { ActivityFeed } from '../components/ActivityFeed';
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
import { SiteFooter } from '../components/SiteFooter';

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
            </div>
          </div>
        </div>
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
            description="I support a network of organizations (through an incubator, co-working, lab, trade association, union, public authority etc.)"
            features={[
              { icon: <MapPin className="h-4 w-4" />, text: 'Map and manage your network' },
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
              { icon: <Network className="h-4 w-4" />, text: 'Discover sustainable organizations and initiatives' },
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
      <SiteFooter />
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
  const isViewer = orgs.length === 0;

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', 'user'],
    queryFn: ({ pageParam }) => getUserFeed({ page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: authed,
  });

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

      {orgs.length > 0 ? (
        <div>
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

      {/* Activity Feed */}
      {!isViewer && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-3">Recent activity</h2>
          <div className="bg-white rounded-lg border border-border">
            <ActivityFeed query={feedQuery} emptyMessage="No recent activity" />
          </div>
        </div>
      )}
    </div>
  );
}
