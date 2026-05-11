import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

export default function Signup() {
  const fr = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; company?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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

    const result = await signUp(email, password, company.trim());
    if (result.error) {
      setErrors({ general: result.error });
      setLoading(false);
    } else {
      navigate('/onboarding/stripe');
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
          <h1 className="text-2xl font-serif font-bold text-[#111827]">
            {fr.onboarding.signup.title}
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">{fr.onboarding.signup.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">{fr.onboarding.signup.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={fr.onboarding.signup.emailPlaceholder}
              autoComplete="email"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-[#ef4444]">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{fr.onboarding.signup.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={fr.onboarding.signup.passwordPlaceholder}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-[#ef4444]">{errors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">{fr.onboarding.signup.companyLabel}</Label>
            <Input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder={fr.onboarding.signup.companyPlaceholder}
              autoComplete="organization"
              aria-invalid={!!errors.company}
            />
            {errors.company && (
              <p className="text-xs text-[#ef4444]">{errors.company}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-sm text-[#ef4444]">{errors.general}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
            disabled={loading}
          >
            {loading ? fr.onboarding.signup.loading : fr.onboarding.signup.cta}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#6b7280]">
          {fr.onboarding.signup.loginLink}{' '}
          <Link to="/login" className="text-[#3b5bdb] hover:underline">
            {fr.onboarding.signup.loginLinkAnchor}
          </Link>
        </p>

        <div className="mt-6 pt-5 border-t border-[#e5e7eb] flex items-center justify-center gap-1.5 text-xs text-[#6b7280]">
          <Lock className="h-3 w-3" />
          <span>{fr.onboarding.signup.zeroPii}</span>
        </div>
      </div>
    </div>
  );
}
