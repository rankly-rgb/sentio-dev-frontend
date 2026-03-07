import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { logger } from '@/utils/productionLogger'; // TEMP DEBUG
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminRoute from '@/components/layout/AdminRoute';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import Segments from '@/pages/Segments';
import SegmentDetail from '@/pages/SegmentDetail';
import Insights from '@/pages/Insights';
import Syncs from '@/pages/Syncs';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import Today from '@/pages/Today';
import Playbooks from '@/pages/Playbooks';
import PlaybookNew from '@/pages/PlaybookNew';
import PlaybookDetail from '@/pages/PlaybookDetail';
import WorkflowDetail from '@/pages/WorkflowDetail';

// Admin
import Organizations from '@/pages/admin/Organizations';
import NewOrganization from '@/pages/admin/NewOrganization';
import Ops from '@/pages/admin/Ops';

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
      onError: (error: Error) => {
        // TEMP DEBUG — log toutes les erreurs de mutation
        logger.error('ReactQuery', 'Mutation failed', {
          message: error.message,
          stack: error.stack,
        });
      },
    },
  },
});

// TEMP DEBUG — log global pour chaque erreur de query
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    const error = event.action.error;
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('ReactQuery', `Query failed: [${event.query.queryKey}]`, {
      message: msg,
      stack,
      queryKey: event.query.queryKey,
    });
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

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
                <Route path="/playbooks/:id" element={<ProtectedRoute><AppLayout><PlaybookDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/workflows/:id" element={<ProtectedRoute><AppLayout><WorkflowDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

                {/* Routes admin */}
                <Route path="/admin/organizations" element={<AdminRoute><AppLayout><Organizations /></AppLayout></AdminRoute>} />
                <Route path="/admin/organizations/new" element={<AdminRoute><AppLayout><NewOrganization /></AppLayout></AdminRoute>} />
                <Route path="/dashboard/ops" element={<AdminRoute><AppLayout><Ops /></AppLayout></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
