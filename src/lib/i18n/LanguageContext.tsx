/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { translations, type Language } from './translations';
import { useAuth } from '@/contexts/AuthContext';

interface OrgSettingsResponse {
  data: { language: Language };
}

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LANGUAGE_QUERY_KEY = ['org-settings', 'language'] as const;

const STORAGE_KEY = 'sentio-lang';

function readStoredLang(): Language | undefined {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'fr' || v === 'en' ? v : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredLang(lang: Language): void {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Read localStorage once on mount — used as placeholder while server responds
  const storedLang = useMemo(() => readStoredLang(), []);

  const { data: serverLang } = useQuery<Language>({
    queryKey: LANGUAGE_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchWithUserJwt<OrgSettingsResponse>('org-settings');
      return res.data.language;
    },
    enabled: !!user,          // Never fire before the user is authenticated
    placeholderData: storedLang, // Show stored preference instantly while fetching
    staleTime: Infinity,
    retry: false,
  });

  // When server confirms a language, persist it so the next session loads instantly
  useEffect(() => {
    if (serverLang) writeStoredLang(serverLang);
  }, [serverLang]);

  // Resolution order: server (confirmed) → localStorage snapshot → safe default
  const language: Language = serverLang ?? storedLang ?? 'fr';

  const { mutate } = useMutation({
    mutationFn: (lang: Language) =>
      fetchWithUserJwt<{ success: boolean }>('org-settings', {
        method: 'PATCH',
        body: { language: lang },
      }),
    onMutate: async (lang) => {
      // Cancel in-flight language queries so they don't overwrite the optimistic value
      await queryClient.cancelQueries({ queryKey: LANGUAGE_QUERY_KEY });
      // Snapshot the current cache value for rollback on error
      const previous = queryClient.getQueryData<Language>(LANGUAGE_QUERY_KEY);
      // Apply optimistic update to both cache and localStorage immediately
      queryClient.setQueryData<Language>(LANGUAGE_QUERY_KEY, lang);
      writeStoredLang(lang);
      return { previous };
    },
    onError: (err, _lang, ctx) => {
      // Determine what to roll back to: previous cache value, or last known stored lang
      const revert: Language = ctx?.previous ?? storedLang ?? 'fr';
      queryClient.setQueryData<Language>(LANGUAGE_QUERY_KEY, revert);
      writeStoredLang(revert);
      // Show exact backend error to help diagnose
      const detail = err instanceof Error ? err.message : String(err);
      toast.error(`[lang toggle] ${detail}`);
    },
  });

  const setLanguage = useCallback((lang: Language) => mutate(lang), [mutate]);

  const t = useCallback(
    (key: string): string => translations[language][key] ?? translations['fr'][key] ?? key,
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
