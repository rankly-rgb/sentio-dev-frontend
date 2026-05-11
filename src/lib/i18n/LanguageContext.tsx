/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { translations, type Language } from './translations';

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: language = 'fr' } = useQuery<Language>({
    queryKey: LANGUAGE_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchWithUserJwt<OrgSettingsResponse>('org-settings');
      return res.data.language;
    },
    staleTime: Infinity,
    retry: false,
  });

  const { mutate } = useMutation({
    mutationFn: (lang: Language) =>
      fetchWithUserJwt<{ success: boolean }>('org-settings', {
        method: 'PATCH',
        body: { language: lang },
      }),
    onMutate: async (lang) => {
      await queryClient.cancelQueries({ queryKey: LANGUAGE_QUERY_KEY });
      const previous = queryClient.getQueryData<Language>(LANGUAGE_QUERY_KEY);
      queryClient.setQueryData<Language>(LANGUAGE_QUERY_KEY, lang);
      return { previous };
    },
    onError: (_err, _lang, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData<Language>(LANGUAGE_QUERY_KEY, ctx.previous);
      }
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
