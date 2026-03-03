import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@/utils/visibilityMonitor'; // side-effect: initialise le singleton
import { keepalive } from '@/utils/keepalive';
import { logger } from '@/utils/productionLogger';
import { toast } from 'sonner';

// ─── Global error handlers (production + dev) ────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);

  logger.error('Global', 'Unhandled Promise Rejection', reason);

  // Toast pour les erreurs réseau non capturées
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    toast.error('Erreur réseau — vérifiez votre connexion');
  }
});

window.addEventListener('error', (event) => {
  logger.error('Global', 'Uncaught Error', event.error);
});

// ─── Offline / Online detection ──────────────────────────────────────────
window.addEventListener('offline', () => {
  toast.error('Connexion perdue — les données ne seront pas mises à jour', {
    duration: Infinity,
    id: 'offline-banner',
  });
});

window.addEventListener('online', () => {
  toast.dismiss('offline-banner');
  toast.success('Connexion rétablie', { duration: 3000 });
});

// ─── Start keepalive heartbeat ───────────────────────────────────────────
keepalive.start();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
