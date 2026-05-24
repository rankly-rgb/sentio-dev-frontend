import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { supabase } from '@/lib/supabase';
import { useCreateOrganization, useOnUserSignup } from '@/hooks/useOnboardingV2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/lib/i18n/translations';

export default function Signup() {
  const t = useT();
  const { setLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [locale, setLocale] = useState<Language>(() => {
    const param = searchParams.get('locale');
    return param === 'en' ? 'en' : 'fr';
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; company?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();
  const onUserSignup = useOnUserSignup();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Keep language context in sync with the toggle so useT() reflects the selection immediately
  useEffect(() => {
    setLanguage(locale);
  }, [locale, setLanguage]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = t.onboarding.signup.errorEmail;
    }
    if (!password || password.length < 8) {
      next.password = t.onboarding.signup.errorPassword;
    }
    if (!company.trim()) {
      next.company = t.onboarding.signup.errorCompany;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const emailValue = email;
    const companyValue = company.trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailValue,
      password,
      options: {
        data: { locale },
        emailRedirectTo: 'https://app.sentioapp.io/auth/callback',
      },
    });

    if (authError) {
      setErrors({ general: authError.message });
      setLoading(false);
      return;
    }

    // Clear email from state immediately after use (Zero-PII)
    setEmail('');

    const userId = authData.user?.id;
    const accessToken = authData.session?.access_token;

    if (!userId || !accessToken) {
      // Email confirmation required — user must confirm before continuing
      setErrors({ general: t.onboarding.signup.errorConfirmEmail });
      setLoading(false);
      return;
    }

    try {
      await createOrg.mutateAsync({ user_id: userId, email: emailValue, company_name: companyValue, access_token: accessToken, locale });
      // on-user-signup : fire-and-forget, session déjà établie
      void onUserSignup.mutateAsync();
      navigate('/onboarding/promise');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : t.onboarding.signup.errorCreateOrg });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-[#111827]">Sentio AI</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#111827]">{t.onboarding.signup.title}</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{t.onboarding.signup.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.onboarding.signup.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.onboarding.signup.emailPlaceholder}
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-[#ef4444]">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t.onboarding.signup.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.onboarding.signup.passwordPlaceholder}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-xs text-[#ef4444]">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">{t.onboarding.signup.companyLabel}</Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder={t.onboarding.signup.companyPlaceholder}
              autoComplete="organization"
              aria-invalid={!!errors.company}
            />
            {errors.company && <p className="text-xs text-[#ef4444]">{errors.company}</p>}
          </div>

          {errors.general && <p className="text-sm text-[#ef4444]">{errors.general}</p>}

          <div className="space-y-1.5">
            <Label>{locale === 'fr' ? 'Langue de l’interface' : 'Interface language'}</Label>
            <div className="flex gap-2">
              {(['fr', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  className={cn(
                    'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                    locale === lang
                      ? 'border-[#3b5bdb] bg-[#3b5bdb]/10 text-[#3b5bdb]'
                      : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#9ca3af]',
                  )}
                >
                  {lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
            disabled={loading}
          >
            {loading ? t.onboarding.signup.loading : t.onboarding.signup.cta}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6b7280]">
          {t.onboarding.signup.loginLink}{' '}
          <Link to="/login" className="text-[#3b5bdb] hover:underline">
            {t.onboarding.signup.loginLinkAnchor}
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-[#e5e7eb] flex items-center justify-center gap-1.5 text-xs text-[#6b7280]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>{t.onboarding.signup.zeroPii}</span>
        </div>
      </div>
    </div>
  );
}
