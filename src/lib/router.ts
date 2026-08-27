import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { z } from 'zod';
import { RootLayout } from '../routes/root';
import { HomePage } from '../routes/home';
import { LoginPage } from '../routes/login';
import { OrganizationShowPage } from '../routes/organizations/show';
import { OrganizationNewPage } from '../routes/organizations/new';
import { OrganizationEditPage } from '../routes/organizations/edit';
import { ExplorerLayout } from '../routes/explorer/layout';
import { GlobalLayout } from '../routes/global/layout';
import { OrgLayout } from '../routes/org/layout';
import { OrgDashboardPage } from '../routes/org/dashboard';
import { OrgProfilePage } from '../routes/org/profile';
import { OrgRelationsPage } from '../routes/org/relations';
import { OrgAssessmentsPage } from '../routes/org/assessments';
import { AssessmentFormPage } from '../routes/org/assessment-form';
import { AssessmentResultsPage } from '../routes/org/assessment-results';
import { OrgSettingsMembersPage } from '../routes/org/settings';
import { DirectoryMapPage } from '../routes/directory-map';
import { ForgotPasswordPage } from '../routes/forgot-password';
import { ResetPasswordPage } from '../routes/reset-password';
import { RegisterPage } from '../routes/register';
import { RegisterHubPage } from '../routes/register-hub';
import { RegisterFacilitatorPage } from '../routes/register-facilitator';
import { RegisterWithOrgPage } from '../routes/register-with-org';
import { RegisterInvitationPage } from '../routes/register-invitation';
import { VerifyInstructionsPage } from '../routes/verify-instructions';
import { VerifyEmailPage } from '../routes/verify-email';
import { TestGoogleAddressPage } from '../routes/test/google-address';
import { DocsPage } from '../routes/docs';
import { ChangelogPage } from '../routes/changelog';
import { FeedbackPage } from '../routes/feedback';
import { AdminLayout } from '../routes/admin/layout';
import { AdminOrganizationsPage } from '../routes/admin/organizations';
import { AdminUsersPage } from '../routes/admin/users';
import { AdminFeedbacksPage } from '../routes/admin/feedbacks';
import { AdminClaimsPage } from '../routes/admin/claims';
import { EventsListPage } from '../routes/events/list';
import { EventNewPage } from '../routes/events/new';
import { EventEditPage } from '../routes/events/edit';
import { EventDetailPage } from '../routes/events/show';
import { NotificationsPage } from '../routes/notifications';
import { SettingsPage } from '../routes/settings';
import { NotificationPreferencesPage } from '../routes/notification-preferences';
import { MessagesPage } from '../routes/messages';
import { OrgMessagesPage } from '../routes/org/messages';
import { OrgListingsPage } from '../routes/org/listings';
import { DataLayout } from '../routes/data/layout';
import { RotterdamPage } from '../routes/data/rotterdam';
import { RotterdamChartsPage } from '../routes/data/rotterdam-charts';
import { AthensPage } from '../routes/data/athens';
import { MarketplaceListPage } from '../routes/marketplace/list';
import { MarketplaceShowPage } from '../routes/marketplace/show';
import { MarketplaceNewPage } from '../routes/marketplace/new';
import { MarketplaceEditPage } from '../routes/marketplace/edit';
import { ValueChainPage } from '../routes/value-chain';
import { FacilitatorDashboardPage } from '../routes/facilitator/dashboard';
import { FacilitatorNetworkPage } from '../routes/facilitator/network';
import { FacilitatorOrgDetailPage } from '../routes/facilitator/org-detail';
import { NetworkInvitationPage } from '../routes/network-invitation';
import { isAuthenticated, getMe, type User } from './auth';
import { queryClient } from './queryClient';

// ── Auth guards ──────────────────────────────────────────────

function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: '/login' });
  }
}

async function ensureMe(): Promise<User> {
  const me = await queryClient.ensureQueryData<User>({
    queryKey: ['me'],
    queryFn: getMe,
  });
  return me;
}

async function requireOrgMember({ params }: { params: { orgSlug: string } }) {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
  const isMember = me.organizations.some(
    (o) => o.organization_slug === params.orgSlug
  );
  if (!isMember) {
    throw redirect({
      to: '/organizations/$id',
      params: { id: params.orgSlug },
    });
  }
}

async function requireFacilitator() {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
  const isFacilitator =
    (me.networks?.length ?? 0) > 0 || me.role === 'facilitator' || me.role === 'admin';
  if (!isFacilitator) {
    throw redirect({ to: '/' });
  }
}

async function requireAdmin() {
  if (!isAuthenticated()) throw redirect({ to: '/login' });
  const me = await ensureMe();
  if (me.role !== 'admin') {
    throw redirect({ to: '/' });
  }
}

// ── Root ─────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: RootLayout,
});

// ── Public ───────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
});

const registerHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: z.object({ invitation_token: z.string().optional() }),
  beforeLoad: ({ search }) => {
    if (search.invitation_token) {
      throw redirect({
        to: '/register-invitation',
        search: { token: search.invitation_token },
      });
    }
  },
  component: RegisterHubPage,
});

const registerBasicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-basic',
  component: RegisterPage,
});

const registerFacilitatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-facilitator',
  component: RegisterFacilitatorPage,
});

const registerWithOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-with-org',
  component: RegisterWithOrgPage,
});

const registerInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register-invitation',
  validateSearch: z.object({ token: z.string().optional() }),
  component: RegisterInvitationPage,
});

const verifyInstructionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-instructions',
  component: VerifyInstructionsPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  validateSearch: z.object({ token: z.string().optional() }),
  component: VerifyEmailPage,
});

// ── Test pages (dev only) ────────────────────────────────────

const testGoogleAddressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/test/google-address',
  component: TestGoogleAddressPage,
});

// ── Static pages ────────────────────────────────────────────

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: DocsPage,
});

const changelogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changelog',
  component: ChangelogPage,
});

const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback',
  beforeLoad: requireAuth,
  component: FeedbackPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/notifications',
  beforeLoad: requireAuth,
  component: NotificationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: requireAuth,
  component: SettingsPage,
});

const notificationPreferencesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notification-preferences',
  beforeLoad: requireAuth,
  component: NotificationPreferencesPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/messages',
  beforeLoad: requireAuth,
  validateSearch: z.object({
    selected: z.string().optional(),
    to: z.string().optional(),
    listing: z.string().optional(),
  }),
  component: MessagesPage,
});

// ── Shell A: Explorer ────────────────────────────────────────

const explorerRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'explorer',
  component: ExplorerLayout,
});

// ── Shell A-Global: Global tabs layout ──────────────────────

const globalRoute = createRoute({
  getParentRoute: () => explorerRoute,
  id: 'global',
  component: GlobalLayout,
});

// Search params shared by the three explore pages (Marketplace, Events, Directory)
const exploreSearchSchema = z.object({
  search: z.string().optional(),
  view: z.enum(['cards', 'list', 'map']).optional(),
  near: z.literal('all').optional(),
  country: z.string().optional(),
  lon: z.number().optional(),
  lat: z.number().optional(),
  radius: z.number().optional(),
  location_label: z.string().optional(),
});

const taxonomySearchSchema = z.object({
  by_type: z.string().optional(),
  by_category: z.string().optional(),
  by_subcategory: z.string().optional(),
});

const globalOverviewRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/global',
  beforeLoad: requireAuth,
  validateSearch: exploreSearchSchema.merge(taxonomySearchSchema).extend({
    kinds: z.string().optional(),
    claimed: z.string().optional(),
  }),
  component: DirectoryMapPage,
});

const indexRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/',
  beforeLoad: async () => {
    if (isAuthenticated()) {
      try {
        const me = await ensureMe();
        if (me.organizations.length > 0) {
          throw redirect({
            to: '/$orgSlug/dashboard',
            params: { orgSlug: me.organizations[0].organization_slug },
          });
        }
      } catch (e) {
        if (e && typeof e === 'object' && 'to' in e) throw e;
        // auth failed, show home page
      }
    }
  },
  component: HomePage,
});

const organizationsRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/organizations',
  beforeLoad: requireAuth,
});

const organizationsIndexRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/',
  validateSearch: z.object({
    search: z.string().optional(),
    kinds: z.string().optional(),
    claimed: z.string().optional(),
    country: z.string().optional(),
    lon: z.number().optional(),
    lat: z.number().optional(),
    radius: z.number().optional(),
    location_label: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/global', search });
  },
});

const organizationNewRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/new',
  component: OrganizationNewPage,
});

const organizationShowRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/$id',
  validateSearch: z.object({
    from: z.enum(['profile']).optional(),
  }),
  component: OrganizationShowPage,
});

const organizationEditRoute = createRoute({
  getParentRoute: () => organizationsRoute,
  path: '/$id/edit',
  component: OrganizationEditPage,
});

const mapRedirectRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/map',
  beforeLoad: () => {
    throw redirect({ to: '/global' });
  },
});

const directoryRedirectRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/directory',
  validateSearch: z.object({
    search: z.string().optional(),
    kinds: z.string().optional(),
    claimed: z.string().optional(),
    country: z.string().optional(),
    lon: z.number().optional(),
    lat: z.number().optional(),
    radius: z.number().optional(),
    location_label: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/global', search });
  },
});

// Legacy redirects: communities have been retired, but links to them are
// still in circulation (notification emails, bookmarks).
const communitiesRedirectRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/communities',
  beforeLoad: () => {
    throw redirect({ to: '/global' });
  },
});

const communityShowRedirectRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/communities/$id',
  beforeLoad: () => {
    throw redirect({ to: '/global' });
  },
});

// ── Data (under Explorer) ────────────────────────────────────

const dataRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/data',
  component: DataLayout,
});

const dataIndexRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/data/rotterdam' });
  },
});

const dataRotterdamRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/rotterdam',
  component: RotterdamPage,
});

const dataRotterdamChartsRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/rotterdam/charts',
  component: RotterdamChartsPage,
});

const dataAthensRoute = createRoute({
  getParentRoute: () => dataRoute,
  path: '/athens',
  component: AthensPage,
});

// ── Marketplace (under Explorer) ─────────────────────────────

const marketplaceRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/marketplace',
});

const marketplaceIndexRoute = createRoute({
  getParentRoute: () => marketplaceRoute,
  path: '/',
  validateSearch: exploreSearchSchema.merge(taxonomySearchSchema),
  component: MarketplaceListPage,
});

const marketplaceNewRoute = createRoute({
  getParentRoute: () => marketplaceRoute,
  path: '/new',
  beforeLoad: requireAuth,
  component: MarketplaceNewPage,
  validateSearch: z.object({
    type: z.string().optional(),
    from: z.string().optional(),
  }),
});

const marketplaceShowRoute = createRoute({
  getParentRoute: () => marketplaceRoute,
  path: '/$id',
  component: MarketplaceShowPage,
});

const marketplaceEditRoute = createRoute({
  getParentRoute: () => marketplaceRoute,
  path: '/$id/edit',
  beforeLoad: requireAuth,
  component: MarketplaceEditPage,
  validateSearch: z.object({
    from: z.string().optional(),
  }),
});

const valueChainRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/value-chain',
  beforeLoad: requireAuth,
  component: ValueChainPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/events',
  validateSearch: exploreSearchSchema.extend({
    when: z.enum(['upcoming', 'past']).optional(),
  }),
  beforeLoad: requireAuth,
  component: EventsListPage,
});

const eventNewRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/events/new',
  beforeLoad: requireAuth,
  component: EventNewPage,
});

const eventEditRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/events/$eventId/edit',
  beforeLoad: requireAuth,
  component: EventEditPage,
});

const eventDetailRoute = createRoute({
  getParentRoute: () => globalRoute,
  path: '/events/$eventId',
  beforeLoad: requireAuth,
  component: EventDetailPage,
});

// ── Facilitator dashboard (CRM) ──────────────────────────────

const facilitatorRoute = createRoute({
  getParentRoute: () => explorerRoute,
  path: '/facilitator',
  beforeLoad: requireFacilitator,
});

const facilitatorDashboardRoute = createRoute({
  getParentRoute: () => facilitatorRoute,
  path: '/',
  validateSearch: z.object({
    network: z.string().optional(),
  }),
  component: FacilitatorDashboardPage,
});

const facilitatorNetworkRoute = createRoute({
  getParentRoute: () => facilitatorRoute,
  path: '/network',
  validateSearch: z.object({
    network: z.string().optional(),
    search: z.string().optional(),
    view: z.enum(['cards', 'list', 'map']).optional(),
    kinds: z.string().optional(),
    economic_health: z.string().optional(),
    country: z.string().optional(),
  }),
  component: FacilitatorNetworkPage,
});

const facilitatorOrgDetailRoute = createRoute({
  getParentRoute: () => facilitatorRoute,
  path: '/network/$norgId',
  validateSearch: z.object({
    network: z.string().optional(),
  }),
  component: FacilitatorOrgDetailPage,
});

const networkInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/network-invitation',
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  component: NetworkInvitationPage,
});

// ── Shell B: Mon Organisation (/$orgSlug) ────────────────────

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$orgSlug',
  beforeLoad: async ({ params }) => {
    requireAuth();
    await requireOrgMember({ params });
  },
  component: OrgLayout,
});

// /$orgSlug → redirect to /$orgSlug/dashboard
const orgIndexRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$orgSlug/dashboard',
      params: { orgSlug: params.orgSlug },
    });
  },
});

const orgDashboardRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/dashboard',
  component: OrgDashboardPage,
});

const orgProfileRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/profile',
  component: OrgProfilePage,
  validateSearch: z.object({
    section: z.enum(['informations', 'specialties', 'data', 'sustainability', 'needs', 'photos']).optional(),
  }),
});

const orgRelationsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/relations',
  component: OrgRelationsPage,
});

const orgAssessmentsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments',
  component: OrgAssessmentsPage,
});

const orgAssessmentFormRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments/$formId',
  component: AssessmentFormPage,
});

const orgAssessmentResultsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/assessments/$formId/results',
  component: AssessmentResultsPage,
});

const orgMessagesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/messages',
  validateSearch: z.object({
    selected: z.string().optional(),
    to: z.string().optional(),
    listing: z.string().optional(),
  }),
  component: OrgMessagesPage,
});

const orgListingsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/listings',
  component: OrgListingsPage,
  validateSearch: z.object({
    type: z.enum(['service', 'material', 'capacity', 'product', 'distribution']).optional(),
  }),
});

const orgSettingsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/settings',
  component: Outlet,
});

const orgSettingsIndexRoute = createRoute({
  getParentRoute: () => orgSettingsRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$orgSlug/settings/members',
      params: { orgSlug: params.orgSlug },
    });
  },
});

const orgSettingsMembersRoute = createRoute({
  getParentRoute: () => orgSettingsRoute,
  path: '/members',
  component: OrgSettingsMembersPage,
});

// ── Admin ────────────────────────────────────────────────────

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: requireAdmin,
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/admin/organizations' });
  },
});

const adminOrganizationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/organizations',
  component: AdminOrganizationsPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: AdminUsersPage,
});

const adminFeedbacksRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/feedbacks',
  component: AdminFeedbacksPage,
});

const adminClaimsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/claims',
  component: AdminClaimsPage,
});

// ── Route tree ───────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerHubRoute,
  registerBasicRoute,
  registerFacilitatorRoute,
  registerWithOrgRoute,
  registerInvitationRoute,
  verifyInstructionsRoute,
  verifyEmailRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  testGoogleAddressRoute,
  docsRoute,
  changelogRoute,
  feedbackRoute,
  settingsRoute,
  notificationPreferencesRoute,
  networkInvitationRoute,
  adminRoute.addChildren([
    adminIndexRoute,
    adminOrganizationsRoute,
    adminUsersRoute,
    adminFeedbacksRoute,
    adminClaimsRoute,
  ]),
  explorerRoute.addChildren([
    indexRoute,
    mapRedirectRoute,
    directoryRedirectRoute,
    communitiesRedirectRoute,
    communityShowRedirectRoute,
    facilitatorRoute.addChildren([
      facilitatorDashboardRoute,
      facilitatorNetworkRoute,
      facilitatorOrgDetailRoute,
    ]),
    messagesRoute,
    notificationsRoute,
    valueChainRoute,
    dataRoute.addChildren([
      dataIndexRoute,
      dataRotterdamRoute,
      dataRotterdamChartsRoute,
      dataAthensRoute,
    ]),
    globalRoute.addChildren([
      globalOverviewRoute,
      organizationsRoute.addChildren([
        organizationsIndexRoute,
        organizationNewRoute,
        organizationShowRoute,
        organizationEditRoute,
      ]),
      marketplaceRoute.addChildren([
        marketplaceIndexRoute,
        marketplaceNewRoute,
        marketplaceShowRoute,
        marketplaceEditRoute,
      ]),
      eventsRoute,
      eventNewRoute,
      eventEditRoute,
      eventDetailRoute,
    ]),
  ]),
  orgRoute.addChildren([
    orgIndexRoute,
    orgDashboardRoute,
    orgProfileRoute,
    orgRelationsRoute,
    orgAssessmentsRoute,
    orgAssessmentResultsRoute,
    orgAssessmentFormRoute,
    orgMessagesRoute,
    orgListingsRoute,
    orgSettingsRoute.addChildren([
      orgSettingsIndexRoute,
      orgSettingsMembersRoute,
    ]),
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
