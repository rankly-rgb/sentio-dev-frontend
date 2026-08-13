// STAGED FOR V2, NOT DEAD CODE — see src/hooks/useOnboardingV2.ts header.
// Unreachable from the live signup flow today (deliberately, not a bug).
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingGuard, useUpdateOnboardingStep } from '@/hooks/useOnboardingV2';
import { useOrgSettings, usePatchOrgSettings } from '@/hooks/useOrgSettings';
import type { OrgSettingsData } from '@/hooks/useOrgSettings';

export default function Invested() {
  const fr = useT();
  const navigate = useNavigate();
  const { isGuarding } = useOnboardingGuard('invested');
  const { data: settings, isLoading: settingsLoading } = useOrgSettings();
  const patchSettings = usePatchOrgSettings();
  const updateStep = useUpdateOnboardingStep();

  const [dangerThreshold, setDangerThreshold] = useState(40);
  const [atRiskThreshold, setAtRiskThreshold] = useState(60);
  const [alertChannel, setAlertChannel] = useState<OrgSettingsData['alert_channel']>('none');

  useEffect(() => {
    if (settings) {
      setDangerThreshold(settings.danger_threshold);
      setAtRiskThreshold(settings.at_risk_threshold);
      setAlertChannel(settings.alert_channel);
    }
  }, [settings]);

  const handleDangerChange = (vals: number[]) => {
    const v = vals[0];
    setDangerThreshold(Math.min(v, atRiskThreshold - 1));
  };

  const handleAtRiskChange = (vals: number[]) => {
    const v = vals[0];
    setAtRiskThreshold(Math.max(v, dangerThreshold + 1));
  };

  const handleSave = async () => {
    await patchSettings.mutateAsync({ danger_threshold: dangerThreshold, at_risk_threshold: atRiskThreshold, alert_channel: alertChannel });
    await updateStep.mutateAsync('hubspot');
    navigate('/onboarding/hubspot');
  };

  const isSubmitting = patchSettings.isPending || updateStep.isPending;

  if (isGuarding || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={4} totalSteps={5} />

      <div className="mx-auto max-w-2xl px-4 py-10 lg:py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#111827] mb-2">
            {fr.onboardingV2.invested.title}
          </h1>
          <p className="text-[#6b7280]">{fr.onboardingV2.invested.subtitle}</p>
        </div>

        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-8">
          {/* Section seuils */}
          <section className="space-y-6">
            <h2 className="font-semibold text-[#111827]">{fr.onboardingV2.invested.thresholdsTitle}</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#374151]">{fr.onboardingV2.invested.dangerThreshold}</Label>
                <span className="text-sm font-bold text-red-600 tabular-nums">{dangerThreshold}</span>
              </div>
              <Slider
                min={10}
                max={atRiskThreshold - 1}
                step={1}
                value={[dangerThreshold]}
                onValueChange={handleDangerChange}
              />
              <p className="text-xs text-[#9ca3af]">10 – {atRiskThreshold - 1}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#374151]">{fr.onboardingV2.invested.atRiskThreshold}</Label>
                <span className="text-sm font-bold text-amber-600 tabular-nums">{atRiskThreshold}</span>
              </div>
              <Slider
                min={dangerThreshold + 1}
                max={80}
                step={1}
                value={[atRiskThreshold]}
                onValueChange={handleAtRiskChange}
              />
              <p className="text-xs text-[#9ca3af]">{dangerThreshold + 1} – 80</p>
            </div>
          </section>

          {/* Section canal d'alerte */}
          <section className="space-y-4 border-t border-[#f3f4f6] pt-6">
            <h2 className="font-semibold text-[#111827]">{fr.onboardingV2.invested.alertTitle}</h2>
            <RadioGroup
              value={alertChannel}
              onValueChange={(v) => setAlertChannel(v as OrgSettingsData['alert_channel'])}
              className="space-y-2"
            >
              {([
                ['none', fr.onboardingV2.invested.alertNone],
                ['slack', fr.onboardingV2.invested.alertSlack],
                ['email', fr.onboardingV2.invested.alertEmail],
                ['both', fr.onboardingV2.invested.alertBoth],
              ] as const).map(([val, label]) => (
                <div key={val} className="flex items-center gap-3">
                  <RadioGroupItem value={val} id={`alert-${val}`} />
                  <Label htmlFor={`alert-${val}`} className="cursor-pointer text-sm">{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Button
            size="lg"
            className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white px-10"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {fr.onboardingV2.invested.ctaLoading}
              </span>
            ) : (
              fr.onboardingV2.invested.cta
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
