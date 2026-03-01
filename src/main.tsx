import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { visibilityMonitor } from '@/utils/visibilityMonitor';
import { keepalive } from '@/utils/keepalive';

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('[Unhandled Promise Rejection]', event.reason);
  }
});

window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    console.error('[Global Error]', event.error);
  }
});

// Start keepalive heartbeat
keepalive.start();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
