import { fr } from '@/i18n/fr';
import { en } from '@/i18n/en';
import { useLanguage } from './useLanguage';

export function useT() {
  const { language } = useLanguage();
  return language === 'en' ? en : fr;
}
