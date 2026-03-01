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
  hubspot_api_key: string | null;
  stripe_connected: boolean;
  hubspot_connected: boolean;
  last_stripe_sync_at: string | null;
  last_hubspot_sync_at: string | null;
  created_at: string;
}
