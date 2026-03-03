import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import OrganizationsList from '@/components/admin/OrganizationsList';

export default function Organizations() {
  interface Invitation {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    token: string;
    status: string;
    shopify_domain: string | null;
    expires_at: string;
    created_at: string;
    accepted_at: string | null;
  }
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvitations() {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvitations(data);
      }
      setLoading(false);
    }

    fetchInvitations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizations and their invitation links.
          </p>
        </div>
        <Link to="/admin/organizations/new">
          <Button className="gap-2 bg-gradient-primary hover:opacity-90 text-white">
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
      ) : (
        <OrganizationsList invitations={invitations} />
      )}

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
