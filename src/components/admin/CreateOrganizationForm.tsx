import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateResult {
  success: boolean;
  organization_id: string;
  organization_name: string;
  invitation_id: string;
  invitation_token: string;
  invitation_url: string;
  expires_at: string;
  email: string;
}

export default function CreateOrganizationForm() {
  const [orgName, setOrgName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('You must be logged in to perform this action.');
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-organization-with-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organization_name: orgName,
            owner_email: ownerEmail,
            shopify_domain: shopifyDomain || undefined,
            expires_in_days: parseInt(expiresInDays, 10),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create organization.');
        setLoading(false);
        return;
      }

      setResult(data);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  function copyUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.invitation_url);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setResult(null);
    setOrgName('');
    setOwnerEmail('');
    setShopifyDomain('');
    setExpiresInDays('7');
    setError('');
    setCopied(false);
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Organization Created</h2>
          <div className="text-left space-y-2 mt-4 mb-6 text-sm text-gray-600">
            <p>
              <span className="font-medium text-foreground">Organization:</span>{' '}
              {result.organization_name}
            </p>
            <p>
              <span className="font-medium text-foreground">Invited:</span> {result.email}
            </p>
            <p>
              <span className="font-medium text-foreground">Expires:</span>{' '}
              {new Date(result.expires_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Invitation URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 text-left mb-1">
              Invitation Link
            </label>
            <div className="flex gap-2">
              <Input value={result.invitation_url} readOnly className="bg-muted text-sm" />
              <Button variant="outline" onClick={copyUrl} className="shrink-0 gap-1.5">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetForm}>
              Create Another
            </Button>
            <Link to="/admin/organizations">
              <Button className="bg-gradient-primary hover:opacity-90 text-white">
                View All Organizations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white p-8 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Organization Name *</label>
            <Input
              type="text"
              placeholder="Glow Skincare Co."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Owner Email *</label>
            <Input
              type="email"
              placeholder="owner@example.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Shopify Domain</label>
            <Input
              type="text"
              placeholder="store-name.myshopify.com"
              value={shopifyDomain}
              onChange={(e) => setShopifyDomain(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Link Expiry *</label>
            <Select value={expiresInDays} onValueChange={setExpiresInDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 text-white"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Organization & Generate Invite
          </Button>
        </form>
      </div>
    </div>
  );
}
