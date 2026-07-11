import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="max-width:520px;margin:80px auto;padding:32px;font-family:system-ui,sans-serif;text-align:center;">
        <h1 style="color:#dc2626;font-size:1.5rem;margin-bottom:12px;">Configuration error</h1>
        <p style="color:#666;margin-bottom:20px;">
          Missing environment variables. The application cannot connect to the database.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:left;font-size:0.875rem;">
          <p style="margin:0 0 8px;font-weight:600;color:#991b1b;">Missing variables:</p>
          <ul style="margin:0;padding-left:20px;color:#b91c1c;">
            ${!supabaseUrl ? '<li>VITE_SUPABASE_URL</li>' : ''}
            ${!supabaseAnonKey ? '<li>VITE_SUPABASE_ANON_KEY</li>' : ''}
          </ul>
        </div>
        <p style="color:#999;font-size:0.75rem;margin-top:16px;">
          Add them in Vercel Dashboard &rarr; Settings &rarr; Environment Variables, then redeploy.
        </p>
      </div>
    `;
  }
  // Hard-fail : ne pas créer un client avec des placeholders
  throw new Error('Missing Supabase variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
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
