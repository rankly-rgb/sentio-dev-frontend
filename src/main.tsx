import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@/utils/visibilityMonitor'; // side-effect: initialise le singleton
import '@/utils/longTaskObserver'; // TEMP DEBUG — détecte les freezes UI
import { logger } from '@/utils/productionLogger';
import { toast } from 'sonner';

// ─── Global error handlers (production + dev) ────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;

  // TEMP DEBUG — contexte enrichi pour tracer les freezes
  logger.error('Global', 'Unhandled Promise Rejection', {
    message: msg,
    stack,
    url: window.location.href,
    ts: new Date().toISOString(),
  });

  // Toast for uncaught network errors
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    toast.error('Network error — check your connection');
  }
});

window.addEventListener('error', (event) => {
  // TEMP DEBUG — contexte enrichi
  logger.error('Global', 'Uncaught Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    url: window.location.href,
    ts: new Date().toISOString(),
  });
});

// ─── Offline / Online detection ──────────────────────────────────────────
window.addEventListener('offline', () => {
  toast.error('Connection lost — data will not be updated', {
    duration: Infinity,
    id: 'offline-banner',
  });
});

window.addEventListener('online', () => {
  toast.dismiss('offline-banner');
  toast.success('Connection restored', { duration: 3000 });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
