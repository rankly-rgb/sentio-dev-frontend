import { ReactNode, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarCheck,
  Users,
  Tag,
  Lightbulb,
  Play,
  RefreshCw,
  LogOut,
  Menu,
  Target,
  Building2,
  Activity,
  Settings,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as dateFnsFr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useInsightStats } from '@/hooks/useInsights';
import { useTodayActions } from '@/hooks/useTodayActions';
import { useWebhookConfig } from '@/hooks/useWebhook';
import { useSessionPing } from '@/hooks/useSessionPing';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { usePendingApprovalsCount } from '@/hooks/usePlaybookDestinations';
import { fr } from '@/i18n/fr';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import AhaMomentModal from '@/components/onboarding/AhaMomentModal';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

const navItems = [
  { label: fr.nav.today, path: '/today', icon: CalendarCheck, badgeKey: 'today' as const },
  { label: fr.nav.dashboard, path: '/dashboard', icon: BarChart3 },
  { label: fr.nav.accounts, path: '/accounts', icon: Users },
  { label: fr.nav.segments, path: '/segments', icon: Tag },
  { label: fr.nav.insights, path: '/insights', icon: Lightbulb },
  { label: fr.nav.playbooks, path: '/playbooks', icon: Play, badgeKey: 'playbooks' as const },
  { label: fr.nav.syncs, path: '/syncs', icon: RefreshCw },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ahaSeen, setAhaSeen] = useState(false);
  const { data: statsData } = useInsightStats();

  useSessionPing();

  const { data: onboardingStatus } = useOnboardingStatus();

  const showAha = !ahaSeen
    && onboardingStatus?.aha_moment_ready === true
    && onboardingStatus.aha_moment_seen === false;

  const handleCloseAha = useCallback(() => {
    setAhaSeen(true);
    fetchWithUserJwt<void>('onboarding-status/aha-seen', { method: 'POST' }).catch(() => {});
  }, []);
  const criticalInsightsCount = statsData?.data?.by_priority?.critical ?? 0;
  const { totalCount: todayActionsCount } = useTodayActions();
  const { data: webhookConfig } = useWebhookConfig();
  const { data: pendingApprovalsCount = 0 } = usePendingApprovalsCount();
  const { data: lastSyncData } = useQuery({
    queryKey: ['sync-status', 'last-completed', user?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('data_syncs')
        .select('completed_at')
        .eq('organization_id', user?.organization_id ?? '')
        .eq('sync_status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      return data?.completed_at ?? null;
    },
    enabled: !!user?.organization_id,
    staleTime: 30_000,
  });

  const lastSyncText = lastSyncData
    ? formatDistanceToNow(new Date(lastSyncData), { addSuffix: true, locale: dateFnsFr })
    : null;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-card">
          <Target className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">Sentio AI</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            SaaS Intelligence
          </span>
        </div>
      </div>

      {/* Nav principale */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ label, path, icon: Icon, badgeKey }) => {
          const active = path === '/today'
            ? location.pathname === '/today'
            : path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(path);

          const rawBadgeCount =
            badgeKey === 'today' ? todayActionsCount
            : badgeKey === 'playbooks' ? pendingApprovalsCount
            : path === '/insights' ? criticalInsightsCount
            : 0;
          const badgeCount = rawBadgeCount > 99 ? '99+' : rawBadgeCount;

          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              <span>{label}</span>
              {(typeof badgeCount === 'string' || badgeCount > 0) ? (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              ) : active ? (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              ) : null}
            </Link>
          );
        })}

        <div className="my-3 border-t border-border/50" />

        <Link
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            location.pathname.startsWith('/settings')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings className={cn('h-[18px] w-[18px] shrink-0', location.pathname.startsWith('/settings') ? 'text-primary' : 'text-muted-foreground')} />
          <span>{fr.nav.settings}</span>
        </Link>

        {/* Playbook destinations */}
        <Link
          to="/playbooks/destinations"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
            location.pathname === '/playbooks/destinations'
              ? 'text-primary bg-primary/5'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Zap className="h-[14px] w-[14px] shrink-0" />
          <span>{fr.nav.playbookDestinations}</span>
        </Link>

        {/* Playbook approvals */}
        <Link
          to="/playbooks/approvals"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
            location.pathname === '/playbooks/approvals'
              ? 'text-primary bg-primary/5'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Play className="h-[14px] w-[14px] shrink-0" />
          <span>{fr.nav.playbookApprovals}</span>
          {pendingApprovalsCount > 0 && (
            <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
            </span>
          )}
        </Link>

        {/* Destinations webhook */}
        <Link
          to="/settings/destinations"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
            location.pathname === '/settings/destinations'
              ? 'text-primary bg-primary/5'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Zap className="h-[14px] w-[14px] shrink-0" />
          <span>{fr.nav.destinations}</span>
        </Link>

        {/* Webhook status indicator */}
        <Link
          to="/settings/integrations"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              webhookConfig?.is_active && !webhookConfig.failure_count
                ? 'bg-emerald-500'
                : webhookConfig?.is_active && webhookConfig.failure_count > 0
                  ? 'bg-orange-500'
                  : 'bg-muted-foreground/40',
            )}
          />
          <span>
            {webhookConfig?.is_active && !webhookConfig.failure_count
              ? fr.integrations.sidebar.webhookActive
              : webhookConfig?.is_active && webhookConfig.failure_count > 0
                ? fr.integrations.sidebar.webhookError
                : fr.integrations.sidebar.webhookNotConfigured}
          </span>
        </Link>
      </nav>

      {/* Admin */}
      {user?.role === 'admin' && (
        <div className="px-3 pb-2">
          <div className="mb-2 border-t border-border/50" />
          <p className="px-3 mb-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Admin</p>
          <Link
            to="/admin/organizations"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              location.pathname.startsWith('/admin/organizations')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Building2 className="h-[18px] w-[18px] shrink-0" />
            Organisations
          </Link>
          <Link
            to="/dashboard/ops"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              location.pathname === '/dashboard/ops'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Activity className="h-[18px] w-[18px] shrink-0" />
            {fr.nav.ops}
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 p-3">
        {user && (
          <div className="mb-2 px-3 py-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.organization_name || 'Organisation'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>{fr.nav.logout}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex w-60 flex-col border-r border-border/50 bg-card">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex h-full w-60 flex-col bg-card shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {onboardingStatus && <OnboardingProgressBar status={onboardingStatus} />}

        <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 lg:px-6">
          <button
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground hidden sm:block">
              Customer Intelligence
            </h1>
            {lastSyncText && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Synchronisé {lastSyncText}
              </div>
            )}
          </div>

          <div className="flex-1" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {showAha && onboardingStatus && (
        <AhaMomentModal status={onboardingStatus} onClose={handleCloseAha} />
      )}
    </div>
  );
}
