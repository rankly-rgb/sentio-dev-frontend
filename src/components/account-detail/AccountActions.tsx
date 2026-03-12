import { Link } from 'react-router-dom';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';
import type { AccountDetail } from '@/lib/types/accounts';

interface Props {
  account: AccountDetail;
}

export default function AccountActions({ account }: Props) {
  const stripeUrl = `https://dashboard.stripe.com/customers/${account.stripe_customer_id}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link to={`/accounts/${account.id}`}>
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          Voir le détail complet
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={stripeUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          {fr.accountDetail.stripeId}
        </a>
      </Button>
      {account.hubspot_company_id && account.hubspot_data && (
        <Button variant="outline" size="sm" asChild>
          <a
            href={`https://app.hubspot.com/contacts/company/${account.hubspot_company_id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            HubSpot
          </a>
        </Button>
      )}
    </div>
  );
}
