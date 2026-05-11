import { useLanguage } from '@/lib/i18n/useLanguage';
import { cn } from '@/lib/utils';
import type { Language } from '@/lib/i18n/translations';

const LANGS: Language[] = ['fr', 'en'];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5">
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-all duration-150',
            language === lang
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
