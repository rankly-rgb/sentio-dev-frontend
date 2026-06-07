export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  organization_id: string;
}

export interface OrganizationDetail {
  id: string;
  name: string;
  stripe_account_id: string | null;
  stripe_customer_id: string | null;
  hubspot_api_key: string | null;
  stripe_connected: boolean;
  hubspot_connected: boolean;
  usage_tracker_connected: boolean;
  usage_tracker_last_event_at: string | null;
  last_stripe_sync_at: string | null;
  last_hubspot_sync_at: string | null;
  created_at: string;
  // Colonnes notification — migration backend requise si absentes en base
  notification_email: string | null;
  churn_alert_enabled: boolean;
  weekly_digest_enabled: boolean;
}

export interface NotificationPreferences {
  notification_email: string | null;
  churn_alert_enabled: boolean;
  weekly_digest_enabled: boolean;
}
