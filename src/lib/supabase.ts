import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="max-width:520px;margin:80px auto;padding:32px;font-family:system-ui,sans-serif;text-align:center;">
        <h1 style="color:#dc2626;font-size:1.5rem;margin-bottom:12px;">Erreur de configuration</h1>
        <p style="color:#666;margin-bottom:20px;">
          Variables d'environnement manquantes. L'application ne peut pas se connecter à la base de données.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:left;font-size:0.875rem;">
          <p style="margin:0 0 8px;font-weight:600;color:#991b1b;">Variables manquantes :</p>
          <ul style="margin:0;padding-left:20px;color:#b91c1c;">
            ${!supabaseUrl ? '<li>VITE_SUPABASE_URL</li>' : ''}
            ${!supabaseAnonKey ? '<li>VITE_SUPABASE_ANON_KEY</li>' : ''}
          </ul>
        </div>
        <p style="color:#999;font-size:0.75rem;margin-top:16px;">
          Ajoutez-les dans Vercel Dashboard &rarr; Settings &rarr; Environment Variables, puis redéployez.
        </p>
      </div>
    `;
  }
  // Hard-fail : ne pas créer un client avec des placeholders
  throw new Error('Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
