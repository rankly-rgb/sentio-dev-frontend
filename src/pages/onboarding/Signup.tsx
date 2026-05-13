import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/lib/i18n/useT';
import { supabase } from '@/lib/supabase';
import { useCreateOrganization } from '@/hooks/useOnboardingV2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

export default function Signup() {
  const fr = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; company?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const createOrg = useCreateOrganization();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = fr.onboarding.signup.errorEmail;
    }
    if (!password || password.length < 8) {
      next.password = fr.onboarding.signup.errorPassword;
    }
    if (!company.trim()) {
      next.company = fr.onboarding.signup.errorCompany;
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

    const { data: authData, error: authError } = await supabase.auth.signUp({ email: emailValue, password });

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
      setErrors({ general: "Vérifiez vos emails pour confirmer votre compte avant de continuer." });
      setLoading(false);
      return;
    }

    try {
      await createOrg.mutateAsync({ user_id: userId, email: emailValue, company_name: companyValue, access_token: accessToken });
      navigate('/onboarding');
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Erreur lors de la création de l'organisation" });
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
          <h1 className="text-2xl font-serif font-bold text-[#111827]">Commencez gratuitement</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Aucune carte bancaire · RGPD by design · Résultats en 5 minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">{fr.onboarding.signup.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email professionnel"
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-[#ef4444]">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{fr.onboarding.signup.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe (8 car. min.)"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
            />
            {errors.password && <p className="text-xs text-[#ef4444]">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">{fr.onboarding.signup.companyLabel}</Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Nom de votre entreprise"
              autoComplete="organization"
              aria-invalid={!!errors.company}
            />
            {errors.company && <p className="text-xs text-[#ef4444]">{errors.company}</p>}
          </div>

          {errors.general && <p className="text-sm text-[#ef4444]">{errors.general}</p>}

          <Button
            type="submit"
            className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
            disabled={loading}
          >
            {loading ? fr.onboarding.signup.loading : "Créer mon compte →"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6b7280]">
          {fr.onboarding.signup.loginLink}{' '}
          <Link to="/login" className="text-[#3b5bdb] hover:underline">
            {fr.onboarding.signup.loginLinkAnchor}
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-[#e5e7eb] flex items-center justify-center gap-1.5 text-xs text-[#6b7280]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Zero-PII · aucune donnée personnelle stockée</span>
        </div>
      </div>
    </div>
  );
}
