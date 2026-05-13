import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronRight } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  useOnboardingStatusV2,
  useUpdateOnboardingStep,
  useAccountsSummaryCount,
  useAccountsSummaryRisk,
  useSaveOrgPreferences,
} from '@/hooks/useOnboardingV2';
import type { TopDangerAccount, OrgPreferences, AccountsSummaryRisk } from '@/lib/types/onboarding-v2';

type Screen = 'loading' | 'promise' | 'stripe' | 'revelation' | 'investment';

const STEP_ORDER = ['promise', 'stripe', 'revelation', 'invested', 'hubspot', 'completed'] as const;

function stepIndex(step: string): number {
  return STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
}

function progressPercent(screen: Screen): number {
  const map: Record<Screen, number> = {
    loading: 0,
    promise: 10,
    stripe: 35,
    revelation: 60,
    investment: 85,
  };
  return map[screen];
}

// ── Counter animation hook ────────────────────────────────────────
function useAnimatedCounter(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ── ProgressBar ───────────────────────────────────────────────────
function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-gray-100">
      <motion.div
        className="h-full bg-[#3b5bdb]"
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Screen A — La Promesse ────────────────────────────────────────
function ScreenPromise({ onNext }: { onNext: () => void }) {
  const fr = useT();
  const { mutateAsync, isPending } = useUpdateOnboardingStep();

  const handleClick = async () => {
    await mutateAsync('promise');
    onNext();
  };

  return (
    <motion.div
      key="promise"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-white"
    >
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-12">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-[#111827]">Sentio AI</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#111827] leading-snug mb-6">
          {fr.onboardingV2.promise.mainText}
        </h1>
        <p className="text-lg text-[#6b7280] mb-12">
          {fr.onboardingV2.promise.subText}
        </p>

        <Button
          size="lg"
          className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white px-10 py-6 text-lg"
          onClick={handleClick}
          disabled={isPending}
        >
          {fr.onboardingV2.promise.cta}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Stripe Help Drawer ────────────────────────────────────────────
function StripeHelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fr = useT();
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>{fr.onboardingV2.stripe.drawerTitle}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {[
            fr.onboardingV2.stripe.drawerStep1,
            fr.onboardingV2.stripe.drawerStep2,
            fr.onboardingV2.stripe.drawerStep3,
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#3b5bdb] text-white text-sm font-bold">
                {i + 1}
              </div>
              <p className="text-sm text-[#374151] leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}

          <div className="mt-6 p-4 rounded-lg bg-blue-50 text-sm text-blue-800">
            <p className="font-medium mb-1">Permissions requises (lecture seule)</p>
            <ul className="space-y-0.5">
              {['Customers → Lecture', 'Subscriptions → Lecture', 'Charges → Lecture', 'Invoices → Lecture'].map(p => (
                <li key={p} className="flex items-center gap-1.5">
                  <span className="text-blue-500">✓</span> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Screen B — Connexion Stripe ───────────────────────────────────
function ScreenStripe({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const fr = useT();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const saveConfig = useSaveIntegrationsConfig();
  const updateStep = useUpdateOnboardingStep();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setError('');
    setLoading(true);
    try {
      await saveConfig.mutateAsync({ provider: 'stripe', api_key: apiKey.trim() });
      await updateStep.mutateAsync('stripe');
      onNext();
    } catch {
      setError(fr.onboardingV2.stripe.errorInvalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StripeHelpDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <motion.div
        key="stripe"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 bg-white"
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-serif font-bold text-[#111827] mb-3">
            {fr.onboardingV2.stripe.title}
          </h1>
          <p className="text-[#6b7280] mb-2">{fr.onboardingV2.stripe.instruction}</p>
          <button
            type="button"
            className="text-sm text-[#3b5bdb] hover:underline mb-6 inline-flex items-center gap-1"
            onClick={() => setDrawerOpen(true)}
          >
            {fr.onboardingV2.stripe.drawerLink} <ChevronRight className="h-3 w-3" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="stripe-key">Clé API Stripe</Label>
              <Input
                id="stripe-key"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={fr.onboardingV2.stripe.keyPlaceholder}
                autoComplete="off"
              />
              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Lock className="h-3 w-3" />
              <span>{fr.onboardingV2.stripe.securityBadge}</span>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
              disabled={loading || !apiKey.trim()}
            >
              {loading ? fr.onboardingV2.stripe.ctaLoading : fr.onboardingV2.stripe.cta}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors"
              onClick={onSkip}
            >
              {fr.onboardingV2.stripe.skipLink}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// We reuse the existing mutation from useOnboardingFlow
import { useSaveIntegrationsConfig } from '@/hooks/useOnboardingFlow';

// ── Animated counter ──────────────────────────────────────────────
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const displayed = useAnimatedCounter(value);
  return <span className={className}>{displayed}</span>;
}

// ── Account risk card ─────────────────────────────────────────────
function RiskCard({ account, index }: { account: TopDangerAccount; index: number }) {
  const fr = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2, duration: 0.4 }}
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{account.company_name}</span>
        <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
          account.health_score < 30 ? 'bg-red-500/80' : 'bg-amber-500/80'
        }`}>
          Score {account.health_score}
        </span>
      </div>
      <p className="text-sm text-white/60">
        MRR : {fr.format.currency(account.mrr_cents)} · {account.segment}
      </p>
    </motion.div>
  );
}

// ── Screen C — La Révélation ──────────────────────────────────────
type RevelationPhase = 'phase1' | 'phase2';

function ScreenRevelation({ onNext }: { onNext: () => void }) {
  const fr = useT();
  const [phase, setPhase] = useState<RevelationPhase>('phase1');
  const [fakeProgress, setFakeProgress] = useState(0);
  const [riskData, setRiskData] = useState<AccountsSummaryRisk | null>(null);
  const updateStep = useUpdateOnboardingStep();

  const { data: countData } = useAccountsSummaryCount();
  const { refetch: fetchRisk } = useAccountsSummaryRisk();

  // Fake progress bar over 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setFakeProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // After 2500ms, transition to phase 2
  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await fetchRisk();
      setRiskData(result.data ?? null);
      setFakeProgress(100);
      setPhase('phase2');
    }, 2500);
    return () => clearTimeout(timer);
  }, [fetchRisk]);

  const handleCta = async () => {
    await updateStep.mutateAsync('revelation');
    onNext();
  };

  const totalAccounts = countData?.total_accounts ?? 0;
  const isDemo = countData?.is_demo ?? false;
  const healthyCount = (riskData?.at_risk_count !== undefined && riskData?.danger_count !== undefined)
    ? Math.max(0, totalAccounts - riskData.at_risk_count - riskData.danger_count)
    : 0;
  const attentionCount = riskData
    ? riskData.at_risk_count + riskData.danger_count
    : 0;

  return (
    <motion.div
      key="revelation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#1a1f3e] text-white"
    >
      <div className="w-full max-w-xl text-center">
        <AnimatePresence mode="wait">
          {phase === 'phase1' ? (
            <motion.div key="phase1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4">
                <AnimatedNumber
                  value={totalAccounts}
                  className="text-7xl font-bold tabular-nums"
                />
              </div>
              <p className="text-xl text-white/70 mb-8">
                {fr.onboardingV2.revelation.detectedSuffix}
              </p>
              <p className="text-white/50 mb-4">{fr.onboardingV2.revelation.phase1Subtitle}</p>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-[#3b5bdb] rounded-full"
                  animate={{ width: `${fakeProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="phase2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Split reveal */}
              <div className="flex gap-6 justify-center mb-10">
                <motion.div
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: -20, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 max-w-[180px] bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-6"
                >
                  <p className="text-4xl font-bold text-emerald-400 mb-2">{healthyCount}</p>
                  <p className="text-sm text-emerald-300">{fr.onboardingV2.revelation.healthy}</p>
                </motion.div>

                <motion.div
                  initial={{ x: 0, opacity: 0 }}
                  animate={{ x: 20, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 max-w-[180px] bg-red-500/20 border border-red-400/30 rounded-2xl p-6"
                >
                  <p className="text-4xl font-bold text-red-400 mb-2">{attentionCount}</p>
                  <p className="text-sm text-red-300">{fr.onboardingV2.revelation.attention}</p>
                </motion.div>
              </div>

              {/* Top risk accounts */}
              {riskData?.top_danger_accounts && riskData.top_danger_accounts.length > 0 && (
                <div className="space-y-3 mb-10 text-left">
                  {riskData.top_danger_accounts.slice(0, 3).map((acc: TopDangerAccount, i: number) => (
                    <RiskCard key={acc.account_id} account={acc} index={i} />
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="bg-white text-[#1a1f3e] hover:bg-white/90 px-8"
                onClick={handleCta}
                disabled={updateStep.isPending}
              >
                {fr.onboardingV2.revelation.cta}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {isDemo && (
          <p className="mt-8 text-xs text-white/40">{fr.onboardingV2.revelation.demoBanner}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Screen D — L'Investissement ───────────────────────────────────
function ScreenInvestment() {
  const fr = useT();
  const navigate = useNavigate();
  const savePrefs = useSaveOrgPreferences();

  const [segChampions, setSegChampions] = useState('Champions');
  const [segStables, setSegStables] = useState('Stables');
  const [segAtRisk, setSegAtRisk] = useState('À risque léger');
  const [segDanger, setSegDanger] = useState('En danger');
  const [dangerThreshold, setDangerThreshold] = useState(40);
  const [atRiskThreshold, setAtRiskThreshold] = useState(60);
  const [alertChannel, setAlertChannel] = useState<OrgPreferences['alert_channel']>('none');

  const handleSave = async () => {
    await savePrefs.mutateAsync({
      danger_threshold: dangerThreshold,
      at_risk_threshold: atRiskThreshold,
      segment_name_champions: segChampions,
      segment_name_at_risk: segAtRisk,
      segment_name_danger: segDanger,
      segment_name_stable: segStables,
      alert_channel: alertChannel,
    });
    navigate('/dashboard', { replace: true });
  };

  const handleDangerChange = (vals: number[]) => {
    const v = vals[0];
    setDangerThreshold(Math.min(v, atRiskThreshold - 1));
  };

  const handleAtRiskChange = (vals: number[]) => {
    const v = vals[0];
    setAtRiskThreshold(Math.max(v, dangerThreshold + 1));
  };

  return (
    <motion.div
      key="investment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white py-12 px-6"
    >
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#111827] mb-2">
            {fr.onboardingV2.investment.title}
          </h1>
          <p className="text-[#6b7280]">{fr.onboardingV2.investment.subtitle}</p>
        </div>

        {/* Section 1 — Noms de segments */}
        <section className="space-y-4">
          <h2 className="font-semibold text-[#111827]">{fr.onboardingV2.investment.segmentsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: fr.onboardingV2.investment.championsLabel, hint: fr.onboardingV2.investment.championsHint, value: segChampions, set: setSegChampions },
              { label: fr.onboardingV2.investment.stablesLabel, hint: fr.onboardingV2.investment.stablesHint, value: segStables, set: setSegStables },
              { label: fr.onboardingV2.investment.atRiskLabel, hint: fr.onboardingV2.investment.atRiskHint, value: segAtRisk, set: setSegAtRisk },
              { label: fr.onboardingV2.investment.dangerLabel, hint: fr.onboardingV2.investment.dangerHint, value: segDanger, set: setSegDanger },
            ].map(({ label, hint, value, set }) => (
              <div key={label} className="space-y-1">
                <Label>{label}</Label>
                <p className="text-xs text-[#9ca3af]">{hint}</p>
                <Input value={value} onChange={e => set(e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 — Seuils */}
        <section className="space-y-6">
          <h2 className="font-semibold text-[#111827]">{fr.onboardingV2.investment.thresholdsTitle}</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{fr.onboardingV2.investment.dangerThreshold}</Label>
              <span className="text-sm font-bold text-red-600">{dangerThreshold}</span>
            </div>
            <Slider
              min={10}
              max={atRiskThreshold - 1}
              step={1}
              value={[dangerThreshold]}
              onValueChange={handleDangerChange}
              className="[&_[data-slider-thumb]]:bg-red-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{fr.onboardingV2.investment.atRiskThreshold}</Label>
              <span className="text-sm font-bold text-amber-600">{atRiskThreshold}</span>
            </div>
            <Slider
              min={dangerThreshold + 1}
              max={80}
              step={1}
              value={[atRiskThreshold]}
              onValueChange={handleAtRiskChange}
            />
          </div>
        </section>

        {/* Section 3 — Canal d'alerte */}
        <section className="space-y-4">
          <h2 className="font-semibold text-[#111827]">{fr.onboardingV2.investment.alertTitle}</h2>
          <RadioGroup
            value={alertChannel}
            onValueChange={(v) => setAlertChannel(v as OrgPreferences['alert_channel'])}
            className="space-y-2"
          >
            {([
              ['none', fr.onboardingV2.investment.alertNone],
              ['slack', fr.onboardingV2.investment.alertSlack],
              ['email', fr.onboardingV2.investment.alertEmail],
              ['both', fr.onboardingV2.investment.alertBoth],
            ] as const).map(([val, label]) => (
              <div key={val} className="flex items-center gap-3">
                <RadioGroupItem value={val} id={`alert-${val}`} />
                <Label htmlFor={`alert-${val}`} className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </section>

        {/* HubSpot info note */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {fr.onboardingV2.investment.hubspotNote}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
          onClick={handleSave}
          disabled={savePrefs.isPending}
        >
          {savePrefs.isPending ? fr.onboardingV2.investment.ctaLoading : fr.onboardingV2.investment.cta}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main OnboardingV2 component ───────────────────────────────────
export default function OnboardingV2() {
  const navigate = useNavigate();
  const { data: status, isLoading } = useOnboardingStatusV2();
  const [screen, setScreen] = useState<Screen>('loading');

  // Derive initial screen from onboarding_step
  useEffect(() => {
    if (!status) return;
    if (status.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const idx = stepIndex(status.onboarding_step);
    if (idx <= 0) setScreen('promise');
    else if (idx === 1) setScreen('stripe');
    else if (idx === 2) setScreen('revelation');
    else setScreen('investment');
  }, [status, navigate]);

  if (isLoading || screen === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="h-8 w-8 border-2 border-[#3b5bdb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <ProgressBar percent={progressPercent(screen)} />
      <AnimatePresence mode="wait">
        {screen === 'promise' && (
          <ScreenPromise onNext={() => setScreen('stripe')} />
        )}
        {screen === 'stripe' && (
          <ScreenStripe
            onNext={() => setScreen('revelation')}
            onSkip={() => setScreen('investment')}
          />
        )}
        {screen === 'revelation' && (
          <ScreenRevelation onNext={() => setScreen('investment')} />
        )}
        {screen === 'investment' && (
          <ScreenInvestment />
        )}
      </AnimatePresence>
    </div>
  );
}
