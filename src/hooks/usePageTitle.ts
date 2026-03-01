import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(function() {
    document.title = title + ' | Jacin AI';
    return function() {
      document.title = 'Jacin AI';
    };
  }, [title]);
}
