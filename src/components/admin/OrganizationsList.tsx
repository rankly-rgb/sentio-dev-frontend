import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface OrganizationsListProps {
  invitations: Invitation[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-600',
  revoked: 'bg-red-100 text-red-800',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrganizationsList({ invitations }: OrganizationsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  function copyInviteLink(id: string, token: string) {
    const url = `${window.location.origin}/onboard/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No invitations yet. Create your first organization.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Shopify</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.email}</TableCell>
              <TableCell className="capitalize">{inv.role}</TableCell>
              <TableCell>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[inv.status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {inv.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {inv.shopify_domain || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(inv.created_at)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDate(inv.expires_at)}
              </TableCell>
              <TableCell>
                {inv.status === 'pending' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteLink(inv.id, inv.token)}
                    className="gap-1.5"
                  >
                    {copiedId === inv.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                ) : inv.status === 'accepted' && inv.accepted_at ? (
                  <span className="text-xs text-green-600">
                    Accepted {formatDate(inv.accepted_at)}
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
