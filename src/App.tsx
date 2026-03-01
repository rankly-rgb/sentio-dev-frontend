import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
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
import MrrDashboard from '@/pages/MrrDashboard';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

// Admin
import Organizations from '@/pages/admin/Organizations';
import NewOrganization from '@/pages/admin/NewOrganization';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Routes protégées avec layout */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><AppLayout><Accounts /></AppLayout></ProtectedRoute>} />
              <Route path="/accounts/:accountId" element={<ProtectedRoute><AppLayout><AccountDetail /></AppLayout></ProtectedRoute>} />
              <Route path="/segments" element={<ProtectedRoute><AppLayout><Segments /></AppLayout></ProtectedRoute>} />
              <Route path="/mrr" element={<ProtectedRoute><AppLayout><MrrDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

              {/* Routes admin */}
              <Route path="/admin/organizations" element={<AdminRoute><AppLayout><Organizations /></AppLayout></AdminRoute>} />
              <Route path="/admin/organizations/new" element={<AdminRoute><AppLayout><NewOrganization /></AppLayout></AdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
