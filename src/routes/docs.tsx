import { useState } from 'react';

type Section =
  | 'getting-started'
  | 'home'
  | 'directory'
  | 'map'
  | 'org-dashboard'
  | 'org-profile'
  | 'org-relations'
  | 'org-assessments'
  | 'org-settings'
  | 'community-overview'
  | 'community-members'
  | 'community-events'
  | 'community-challenges'
  | 'community-matchmaking';

interface NavGroup {
  title: string;
  items: { key: Section; label: string }[];
}

const NAV: NavGroup[] = [
  {
    title: 'Getting started',
    items: [{ key: 'getting-started', label: 'Welcome' }],
  },
  {
    title: 'Explore',
    items: [
      { key: 'home', label: 'Home' },
      { key: 'directory', label: 'Directory' },
      { key: 'map', label: 'Interactive Map' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { key: 'org-dashboard', label: 'Dashboard' },
      { key: 'org-profile', label: 'Profile' },
      { key: 'org-relations', label: 'Relations' },
      { key: 'org-assessments', label: 'Impact Compass' },
      { key: 'org-settings', label: 'Settings & Members' },
    ],
  },
  {
    title: 'Communities',
    items: [
      { key: 'community-overview', label: 'Overview' },
      { key: 'community-members', label: 'Members' },
      { key: 'community-events', label: 'Events' },
      { key: 'community-challenges', label: 'Challenges' },
      { key: 'community-matchmaking', label: 'Matchmaking' },
    ],
  },
];

// ─── Content ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mb-4">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
      <p className="text-sm text-primary/90">{children}</p>
    </div>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
      Coming soon
    </div>
  );
}

function GettingStartedContent() {
  return (
    <div>
      <SectionTitle>Welcome to Fabrix</SectionTitle>
      <P>
        Fabrix is a platform for promoting and optimizing circular textile in
        Europe. It connects organizations, facilitators, and researchers to build
        a more sustainable textile ecosystem.
      </P>

      <Feature title="Who is Fabrix for?">
        <ul className="list-disc list-inside space-y-1.5 mt-1">
          <li>
            <strong>Organizations</strong> (SMEs) — designers, producers,
            collectors, recyclers. Find partners, access shared resources, and
            improve your circularity practices.
          </li>
          <li>
            <strong>Facilitators</strong> — city-level managers of the circular
            textile ecosystem. Track organizations, advise, matchmake, and manage
            shared spaces.
          </li>
          <li>
            <strong>Researchers</strong> — use aggregated data to produce
            insights for facilitators and policy makers.
          </li>
        </ul>
      </Feature>

      <Feature title="First steps">
        <ol className="list-decimal list-inside space-y-1.5 mt-1">
          <li>
            <strong>Create an account</strong> and register your organization, or
            claim an existing one from the directory.
          </li>
          <li>
            <strong>Complete your profile</strong> — add your address, type of
            activity, and description so others can find you.
          </li>
          <li>
            <strong>Explore the directory and map</strong> — discover other
            organizations in the circular textile space.
          </li>
          <li>
            <strong>Join a community</strong> — participate in events,
            challenges, and find partners through matchmaking.
          </li>
        </ol>
      </Feature>

      <Feature title="Two ways to navigate">
        <ul className="list-disc list-inside space-y-1.5 mt-1">
          <li>
            <strong>Explorer</strong> — browse the directory, map, and public
            profiles. Available from the sidebar on the left.
          </li>
          <li>
            <strong>Organization view</strong> — manage your own organization.
            Switch between your organizations using the dropdown in the top-left
            corner.
          </li>
        </ul>
      </Feature>
    </div>
  );
}

function HomeContent() {
  return (
    <div>
      <SectionTitle>Home</SectionTitle>
      <P>
        The home page adapts to whether you are signed in or not.
      </P>

      <Feature title="Not signed in">
        You see a landing page inviting you to create an account or sign in.
        This is the entry point for new users discovering Fabrix.
      </Feature>

      <Feature title="Signed in">
        You see all the organizations linked to your account displayed as cards.
        Each card shows the organization name, type, number of relations,
        assessment progress, and communities joined. Click on any card to jump
        straight into that organization&apos;s dashboard.
      </Feature>

      <Tip>
        If you don&apos;t have any organization yet, you&apos;ll see a prompt to
        add one — either by creating a new organization or claiming an existing
        one from the directory.
      </Tip>
    </div>
  );
}

function DirectoryContent() {
  return (
    <div>
      <SectionTitle>Directory</SectionTitle>
      <P>
        The directory is the central place to discover all organizations
        registered on Fabrix. It is accessible from the Explorer sidebar.
      </P>

      <Feature title="Search">
        Use the search bar at the top to find organizations by name. Results
        update as you type.
      </Feature>

      <Feature title="List and card views">
        Toggle between a compact list view and a visual card view using the
        icons next to the search bar. Both views show the organization name,
        type badge, address, and number of relations.
      </Feature>

      <Feature title="Pagination">
        Results are paginated (20 per page). Use the Previous / Next buttons at
        the bottom to browse through all organizations.
      </Feature>

      <Feature title="Organization profiles">
        Click on any organization to view its public profile. From there you can
        see their description, location, communities, related organizations, and
        contact information.
      </Feature>

      <Feature title="Add an organization">
        Click the &ldquo;New Organization&rdquo; button to start the creation
        wizard. You can either create a brand new organization or claim an
        existing unclaimed one.
      </Feature>
    </div>
  );
}

function MapContent() {
  return (
    <div>
      <SectionTitle>Interactive Map</SectionTitle>
      <P>
        The map gives you a geographic view of the entire Fabrix ecosystem. Every
        organization with a location is displayed as a colored marker.
      </P>

      <Feature title="Color-coded markers">
        Each organization type has a different color. Use the legend on the map
        to identify which color corresponds to which type (producers, recyclers,
        brands, etc.).
      </Feature>

      <Feature title="Filtering">
        Use the legend to toggle organization types on and off. This helps you
        focus on the types of organizations you are looking for.
      </Feature>

      <Feature title="Navigation">
        Zoom in and out, pan the map, and click on markers to see organization
        details.
      </Feature>
    </div>
  );
}

function OrgDashboardContent() {
  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>
      <P>
        The dashboard is your organization&apos;s home page. It gives you a
        quick overview of your activity on Fabrix.
      </P>

      <Feature title="Overview cards">
        Three cards summarize your organization&apos;s engagement:
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            <strong>Relations</strong> — how many organizations you are connected
            to in your supply chain network.
          </li>
          <li>
            <strong>Assessments</strong> — how many sustainability assessments
            you have completed out of the total available.
          </li>
          <li>
            <strong>Communities</strong> — how many communities your organization
            is part of.
          </li>
        </ul>
      </Feature>

      <Tip>
        Use the dropdown in the top-left corner to switch between your
        organizations at any time.
      </Tip>
    </div>
  );
}

function OrgProfileContent() {
  return (
    <div>
      <SectionTitle>Profile</SectionTitle>
      <P>
        Your organization&apos;s profile is what other users see when they
        discover you in the directory or on the map.
      </P>

      <Feature title="What&apos;s on your profile">
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Cover image and logo</li>
          <li>Organization name and type</li>
          <li>Address and location</li>
          <li>Description of your activity</li>
          <li>Contact information (website, email, phone)</li>
          <li>Communities you belong to</li>
          <li>Related organizations</li>
        </ul>
      </Feature>

      <Feature title="Editing your profile">
        Go to your organization profile and click &ldquo;Edit&rdquo; to update
        any information. Make sure your address is accurate — it determines
        your position on the map.
      </Feature>

      <Tip>
        A complete profile makes it easier for other organizations and
        facilitators to find and connect with you.
      </Tip>
    </div>
  );
}

function OrgRelationsContent() {
  return (
    <div>
      <SectionTitle>Relations</SectionTitle>
      <P>
        Relations represent your supply chain connections — the organizations you
        work with as partners, suppliers, or clients.
      </P>

      <Feature title="For organizations">
        Build your supply chain network by connecting with partners. Your
        relations are visible on your public profile and help others understand
        your position in the ecosystem.
      </Feature>

      <Feature title="For facilitators">
        Track connections between organizations in your territory. Monitor how
        the local supply chain network is growing and identify gaps.
      </Feature>

      <ComingSoon />
    </div>
  );
}

function OrgAssessmentsContent() {
  return (
    <div>
      <SectionTitle>Impact Compass</SectionTitle>
      <P>
        The Impact Compass is Fabrix&apos;s assessment system. It helps you
        evaluate and improve your circularity, eco-design, and social
        responsibility practices.
      </P>

      <Feature title="For organizations">
        Complete assessments to measure where you stand on key sustainability
        criteria. Your results feed into your public profile and help
        facilitators understand how to support you.
      </Feature>

      <Feature title="For facilitators">
        Monitor assessment completion across your community. Use the data to
        identify where organizations need the most support and track progress
        over time.
      </Feature>

      <ComingSoon />
    </div>
  );
}

function OrgSettingsContent() {
  return (
    <div>
      <SectionTitle>Settings & Members</SectionTitle>
      <P>
        Manage who has access to your organization on Fabrix.
      </P>

      <Feature title="Members">
        View all members of your organization with their name, email, and role.
        There are two roles:
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            <strong>Owner</strong> — full access. Can manage members, edit the
            profile, and change settings.
          </li>
          <li>
            <strong>Member</strong> — can view and participate, but cannot manage
            other members.
          </li>
        </ul>
      </Feature>

      <Feature title="Invite people">
        Owners can invite new members by email. Choose the role (Member or Owner)
        when sending the invitation. Pending invitations can be cancelled before
        they are accepted.
      </Feature>

      <Feature title="Change roles">
        Owners can promote a member to owner, or change an owner to member. The
        platform will prevent you from removing the last owner.
      </Feature>
    </div>
  );
}

function CommunityOverviewContent() {
  return (
    <div>
      <SectionTitle>Community Overview</SectionTitle>
      <P>
        A community is a group of organizations, managed by facilitators, who
        share a common goal — usually around a geographic area or a thematic
        focus in circular textile.
      </P>

      <Feature title="What communities offer">
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>A shared space to discover and connect with other members</li>
          <li>Events organized by facilitators (workshops, meetups, webinars)</li>
          <li>Challenges to find partners and drive innovation</li>
          <li>Matchmaking to connect with the right organizations</li>
        </ul>
      </Feature>

      <Feature title="Accessing a community">
        Communities are always accessed through your organization. Use the
        &ldquo;Communities&rdquo; section in your organization sidebar to see
        which communities you belong to, then click to enter.
      </Feature>
    </div>
  );
}

function CommunityMembersContent() {
  return (
    <div>
      <SectionTitle>Community Members</SectionTitle>
      <P>
        Browse all organizations that are part of this community.
      </P>

      <Feature title="For organizations">
        Discover other organizations in your community. See their profiles, what
        they do, and where they are located.
      </Feature>

      <Feature title="For facilitators">
        Grow your network by inviting organizations and managing membership.
        Track how the community is developing over time.
      </Feature>

      <ComingSoon />
    </div>
  );
}

function CommunityEventsContent() {
  return (
    <div>
      <SectionTitle>Events</SectionTitle>
      <P>
        Community events are organized by facilitators to bring members together.
      </P>

      <Feature title="For organizations">
        Attend workshops, meetups, and webinars. Learn from peers, network, and
        collaborate on shared challenges.
      </Feature>

      <Feature title="For facilitators">
        Create and manage events for your community. Organize workshops, training
        sessions, or networking events to support your members.
      </Feature>

      <ComingSoon />
    </div>
  );
}

function CommunityChallengesContent() {
  return (
    <div>
      <SectionTitle>Challenges</SectionTitle>
      <P>
        Challenges are calls for participation managed by facilitators to solve
        specific problems or find partners.
      </P>

      <Feature title="For organizations">
        Apply to challenges that match your capabilities. Showcase what you can
        offer and find new business opportunities.
      </Feature>

      <Feature title="For facilitators">
        Launch challenges to find the right partners for specific needs. Drive
        innovation and connect supply and demand within your community.
      </Feature>

      <ComingSoon />
    </div>
  );
}

function CommunityMatchmakingContent() {
  return (
    <div>
      <SectionTitle>Matchmaking</SectionTitle>
      <P>
        Matchmaking helps you find the right partners based on your profile,
        capabilities, and needs.
      </P>

      <Feature title="For organizations">
        Get matched with organizations that complement your activity. Whether you
        are looking for a supplier, a recycler, or a design partner — Fabrix
        helps you find the right fit.
      </Feature>

      <Feature title="For facilitators">
        Facilitate connections between organizations in your community. Help them
        find matches they might not have discovered on their own.
      </Feature>

      <ComingSoon />
    </div>
  );
}

const CONTENT: Record<Section, () => React.ReactNode> = {
  'getting-started': GettingStartedContent,
  home: HomeContent,
  directory: DirectoryContent,
  map: MapContent,
  'org-dashboard': OrgDashboardContent,
  'org-profile': OrgProfileContent,
  'org-relations': OrgRelationsContent,
  'org-assessments': OrgAssessmentsContent,
  'org-settings': OrgSettingsContent,
  'community-overview': CommunityOverviewContent,
  'community-members': CommunityMembersContent,
  'community-events': CommunityEventsContent,
  'community-challenges': CommunityChallengesContent,
  'community-matchmaking': CommunityMatchmakingContent,
};

// ─── Page ─────────────────────────────────────────────────────────────────

export function DocsPage() {
  const [active, setActive] = useState<Section>('getting-started');
  const Content = CONTENT[active];

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-white flex-shrink-0 overflow-y-auto">
        <nav className="p-3 space-y-4">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => setActive(item.key)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                        active === item.key
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <Content />
        </div>
      </div>
    </div>
  );
}
