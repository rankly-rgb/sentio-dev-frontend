/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { translations, type Language } from './translations';
import { useAuth } from '@/contexts/AuthContext';

interface GetLocaleResponse {
  locale: Language;
}

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LANGUAGE_QUERY_KEY = ['org-locale'] as const;

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

  // useState is the source of truth for the UI — always reactive, never blocked by network
  const [language, setLang] = useState<Language>(() => readStoredLang() ?? 'fr');

  // Server query: cross-device sync only, fires after auth is ready
  const { data: serverLang } = useQuery<Language>({
    queryKey: LANGUAGE_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchWithUserJwt<GetLocaleResponse>('get-organization-locale');
      return res.locale;
    },
    enabled: !!user,
    staleTime: Infinity,
    retry: false,
  });

  // When server responds with a confirmed preference, adopt it (cross-device sync)
  useEffect(() => {
    if (serverLang) {
      setLang(serverLang);
      writeStoredLang(serverLang);
    }
  }, [serverLang]);

  // Best-effort server PATCH — failure is silent, local state is already applied
  const { mutate } = useMutation({
    mutationFn: (lang: Language) =>
      fetchWithUserJwt<{ success: boolean; locale: Language }>('update-organization-locale', {
        method: 'PATCH',
        body: { locale: lang },
      }),
    onSuccess: (_, lang) => {
      // Confirm the server accepted it — update cache so cross-device sync is correct
      queryClient.setQueryData<Language>(LANGUAGE_QUERY_KEY, lang);
    },
  });

  const setLanguage = useCallback(
    (lang: Language) => {
      // 1. Update UI immediately — no network dependency
      setLang(lang);
      writeStoredLang(lang);
      // 2. Cancel any in-flight language queries to avoid overwriting our choice
      queryClient.cancelQueries({ queryKey: LANGUAGE_QUERY_KEY }).catch(() => null);
      // 3. Fire PATCH best-effort (needed for cross-device persistence)
      mutate(lang);
    },
    [mutate, queryClient],
  );

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
