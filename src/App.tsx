import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from '@/utils/productionLogger';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminRoute from '@/components/layout/AdminRoute';

// Pages critiques — chargées immédiatement (chemin initial de l'utilisateur)
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';

// Pages lazy — chargées à la demande (code splitting)
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Today = lazy(() => import('@/pages/Today'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const AccountDetail = lazy(() => import('@/pages/AccountDetail'));
const Segments = lazy(() => import('@/pages/Segments'));
const SegmentDetail = lazy(() => import('@/pages/SegmentDetail'));
const Insights = lazy(() => import('@/pages/Insights'));
const Syncs = lazy(() => import('@/pages/Syncs'));
const Settings = lazy(() => import('@/pages/Settings'));
const Playbooks = lazy(() => import('@/pages/Playbooks'));
const PlaybookNew = lazy(() => import('@/pages/PlaybookNew'));
const PlaybookDetail = lazy(() => import('@/pages/PlaybookDetail'));
const PlaybookApprovals = lazy(() => import('@/pages/PlaybookApprovals'));
const PlaybookDestinations = lazy(() => import('@/pages/PlaybookDestinations'));
const WorkflowDetail = lazy(() => import('@/pages/WorkflowDetail'));
// V2 - HubSpot/Webhook : lazy imports conservés pour V2
// const Integrations = lazy(() => import('@/pages/Integrations'));
// const Webhook = lazy(() => import('@/pages/Webhook'));
// const WebhookDestinations = lazy(() => import('@/pages/WebhookDestinations'));

// Admin (lazy — routes admin uniquement)
const Organizations = lazy(() => import('@/pages/admin/Organizations'));
const NewOrganization = lazy(() => import('@/pages/admin/NewOrganization'));
const Ops = lazy(() => import('@/pages/admin/Ops'));

// Onboarding (lazy — flux one-shot)
const Signup = lazy(() => import('@/pages/onboarding/Signup'));
const OnboardingV2 = lazy(() => import('@/pages/onboarding/OnboardingV2'));
const Promise = lazy(() => import('@/pages/onboarding/Promise'));
const StripeConnect = lazy(() => import('@/pages/onboarding/StripeConnect'));
const Revelation = lazy(() => import('@/pages/onboarding/Revelation'));
const Invested = lazy(() => import('@/pages/onboarding/Invested'));
const SyncWait = lazy(() => import('@/pages/onboarding/SyncWait'));
const OnboardingImport = lazy(() => import('@/pages/onboarding/OnboardingImport'));
const OnboardingFirstWin = lazy(() => import('@/pages/onboarding/OnboardingFirstWin'));
// V2 - HubSpot : la page redirige automatiquement vers /onboarding/done en V1 (route conservée comme filet de sécurité)
const HubSpot = lazy(() => import('@/pages/onboarding/HubSpot'));
const Done = lazy(() => import('@/pages/onboarding/Done'));
const StripeCallback = lazy(() => import('@/pages/onboarding/StripeCallback'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Ne pas retry sur les erreurs d'auth ou not found
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('401') || msg.includes('unauthorized') ||
              msg.includes('403') || msg.includes('forbidden') ||
              msg.includes('404') || msg.includes('session expir')) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// TODO: retirer après résolution du freeze — date audit: 2026-05-17
if (import.meta.env.DEV) {
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      const error = event.action.error;
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('ReactQuery', `Query failed: [${event.query.queryKey}]`, {
        message: msg,
        queryKey: event.query.queryKey,
      });
    }
  });
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
            <ErrorBoundary>
              <Suspense fallback={null}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Flux onboarding V2 (authentifié, sans AppLayout) */}
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingV2 /></ProtectedRoute>} />

                {/* Flux onboarding V1 (legacy, sans AppLayout) */}
                <Route path="/onboarding/stripe-callback" element={<ProtectedRoute><StripeCallback /></ProtectedRoute>} />
                <Route path="/onboarding/promise" element={<ProtectedRoute><Promise /></ProtectedRoute>} />
                <Route path="/onboarding/stripe" element={<ProtectedRoute><StripeConnect /></ProtectedRoute>} />
                <Route path="/onboarding/revelation" element={<ProtectedRoute><Revelation /></ProtectedRoute>} />
                <Route path="/onboarding/invested" element={<ProtectedRoute><Invested /></ProtectedRoute>} />
                <Route path="/onboarding/sync" element={<ProtectedRoute><SyncWait /></ProtectedRoute>} />
                <Route path="/onboarding/import" element={<ProtectedRoute><OnboardingImport /></ProtectedRoute>} />
                <Route path="/onboarding/first-win" element={<ProtectedRoute><OnboardingFirstWin /></ProtectedRoute>} />
                <Route path="/onboarding/hubspot" element={<ProtectedRoute><HubSpot /></ProtectedRoute>} />
                <Route path="/onboarding/done" element={<ProtectedRoute><Done /></ProtectedRoute>} />

                {/* Routes protégées avec layout */}
                <Route path="/today" element={<ProtectedRoute><AppLayout><Today /></AppLayout></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute><AppLayout><Accounts /></AppLayout></ProtectedRoute>} />
                <Route path="/accounts/:accountId" element={<ProtectedRoute><AppLayout><AccountDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/segments" element={<ProtectedRoute><AppLayout><Segments /></AppLayout></ProtectedRoute>} />
                <Route path="/segments/:segment" element={<ProtectedRoute><AppLayout><SegmentDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
                <Route path="/syncs" element={<ProtectedRoute><AppLayout><Syncs /></AppLayout></ProtectedRoute>} />
                <Route path="/playbooks" element={<ProtectedRoute><AppLayout><Playbooks /></AppLayout></ProtectedRoute>} />
                <Route path="/playbooks/new" element={<ProtectedRoute><AppLayout><PlaybookNew /></AppLayout></ProtectedRoute>} />
                <Route path="/playbooks/destinations" element={<ProtectedRoute><AppLayout><PlaybookDestinations /></AppLayout></ProtectedRoute>} />
                <Route path="/playbooks/approvals" element={<ProtectedRoute><AppLayout><PlaybookApprovals /></AppLayout></ProtectedRoute>} />
                <Route path="/playbooks/:id" element={<ProtectedRoute><AppLayout><PlaybookDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/workflows/:id" element={<ProtectedRoute><AppLayout><WorkflowDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                {/* V2 - HubSpot/Webhook/Destinations : routes masquées en V1
                <Route path="/settings/integrations" element={<ProtectedRoute><AppLayout><Integrations /></AppLayout></ProtectedRoute>} />
                <Route path="/settings/webhook" element={<ProtectedRoute><AppLayout><Webhook /></AppLayout></ProtectedRoute>} />
                <Route path="/settings/destinations" element={<ProtectedRoute><AppLayout><WebhookDestinations /></AppLayout></ProtectedRoute>} />
                */}

                {/* Routes admin */}
                <Route path="/admin/organizations" element={<AdminRoute><AppLayout><Organizations /></AppLayout></AdminRoute>} />
                <Route path="/admin/organizations/new" element={<AdminRoute><AppLayout><NewOrganization /></AppLayout></AdminRoute>} />
                <Route path="/dashboard/ops" element={<AdminRoute><AppLayout><Ops /></AppLayout></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ErrorBoundary>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
