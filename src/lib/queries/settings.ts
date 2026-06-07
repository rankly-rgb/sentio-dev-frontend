import { supabase } from '@/lib/supabase';
import type { TeamMember, UserProfile, OrganizationDetail, NotificationPreferences } from '@/lib/types/settings';

/** Masquer un email pour l'affichage Zero-PII */
export function maskEmail(email: string): string {
  if (!email) return '***@***.***';
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return '***@***.***';
  const local = email.charAt(0) + '***';
  const domainPart = email.substring(atIndex + 1);
  const dotIndex = domainPart.lastIndexOf('.');
  if (dotIndex < 1) return local + '@***.***';
  const ext = domainPart.substring(dotIndex);
  return local + '@***' + ext;
}

export async function getTeamMembers(orgId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('profiles_')
    .select('id, email, full_name, role, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Échec chargement des membres : ' + error.message);

  return (data || []).map(row => ({
    id: row.id,
    email: row.email || '',
    full_name: row.full_name || null,
    role: row.role || 'member',
    created_at: row.created_at || '',
  }));
}

export async function getCurrentProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles_')
    .select('id, email, full_name, role, organization_id, organizations:organization_id (id, name)')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!data) return null;

  return {
    id: data.id,
    email: data.email || '',
    full_name: data.full_name || null,
    role: data.role || 'member',
    organization_id: data.organization_id || '',
  };
}

export async function getOrganizationDetails(orgId: string): Promise<OrganizationDetail | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, created_at, stripe_account_id, stripe_customer_id, hubspot_api_key, usage_tracker_connected, usage_tracker_last_event_at, notification_email, churn_alert_enabled, weekly_digest_enabled')
    .eq('id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!data) return null;

  const d = data as typeof data & {
    notification_email?: string | null;
    churn_alert_enabled?: boolean | null;
    weekly_digest_enabled?: boolean | null;
  };

  return {
    id: d.id,
    name: d.name || '',
    stripe_account_id: d.stripe_account_id || null,
    stripe_customer_id: d.stripe_customer_id || null,
    hubspot_api_key: d.hubspot_api_key || null,
    stripe_connected: !!d.stripe_account_id,
    hubspot_connected: !!d.hubspot_api_key,
    usage_tracker_connected: !!d.usage_tracker_connected,
    usage_tracker_last_event_at: d.usage_tracker_last_event_at || null,
    last_stripe_sync_at: null,
    last_hubspot_sync_at: null,
    created_at: d.created_at || '',
    notification_email: d.notification_email ?? null,
    churn_alert_enabled: d.churn_alert_enabled ?? false,
    weekly_digest_enabled: d.weekly_digest_enabled ?? false,
  };
}

export async function updateNotificationPreferences(
  orgId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      notification_email: prefs.notification_email,
      churn_alert_enabled: prefs.churn_alert_enabled,
      weekly_digest_enabled: prefs.weekly_digest_enabled,
    })
    .eq('id', orgId);

  if (error) throw new Error('Échec de la sauvegarde des préférences : ' + error.message);
}
