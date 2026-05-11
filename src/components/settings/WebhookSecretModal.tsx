import { useState } from 'react';
import { Copy, Check, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/useT';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: string;
}

const NODE_SNIPPET = `const crypto = require('crypto');

const signature = req.headers['x-sentio-signature'];
const computed  = crypto
  .createHmac('sha256', process.env.SENTIO_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== computed) {
  return res.status(401).send('Signature invalide');
}

// Utiliser stripe_customer_id pour retrouver le contact
const { stripe_customer_id, signals } = req.body.account;
// Votre outil email a deja ce mapping via son integration Stripe`;

const PYTHON_SNIPPET = `import hmac, hashlib, json

signature = request.headers.get('X-Sentio-Signature')
computed = hmac.new(
    SENTIO_SECRET.encode(),
    json.dumps(request.json).encode(),
    hashlib.sha256
).hexdigest()

if not hmac.compare_digest(signature, computed):
    return Response('Signature invalide', status=401)

stripe_customer_id = request.json['account']['stripe_customer_id']
# Votre outil email a deja ce mapping via son integration Stripe`;

const PHP_SNIPPET = `$signature = $_SERVER['HTTP_X_SENTIO_SIGNATURE'] ?? '';
$computed  = hash_hmac(
    'sha256',
    file_get_contents('php://input'),
    getenv('SENTIO_WEBHOOK_SECRET')
);

if (!hash_equals($computed, $signature)) {
    http_response_code(401);
    exit('Signature invalide');
}

$payload = json_decode(file_get_contents('php://input'), true);
$stripe_customer_id = $payload['account']['stripe_customer_id'];
// Votre outil email a deja ce mapping via son integration Stripe`;

const PAYLOAD_EXAMPLE = JSON.stringify(
  {
    event: 'churn_risk_critical',
    account: {
      stripe_customer_id: 'cus_ABC123',
      health_score: 24,
      mrr_cents: 49900,
    },
    signals: {
      churn_risk_score: 84,
      days_since_last_login: 45,
    },
    timestamp: '2026-03-07T10:00:00Z',
  },
  null,
  2,
);

export default function WebhookSecretModal({ open, onOpenChange, secret }: Props) {
  const fr = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {fr.integrations.secretModal.title}
          </DialogTitle>
          <DialogDescription>
            {fr.integrations.secretModal.warning}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Secret display + copy */}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <code className="flex-1 text-sm font-mono break-all select-all">
              {secret}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1.5">
                {copied ? fr.integrations.webhook.copied : fr.integrations.webhook.copy}
              </span>
            </Button>
          </div>

          {/* Code snippets */}
          <div>
            <p className="text-sm font-medium mb-2">
              {fr.integrations.secretModal.verifySignature}
            </p>
            <Tabs defaultValue="nodejs">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
              </TabsList>
              <TabsContent value="nodejs">
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                  <code>{NODE_SNIPPET}</code>
                </pre>
              </TabsContent>
              <TabsContent value="python">
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                  <code>{PYTHON_SNIPPET}</code>
                </pre>
              </TabsContent>
              <TabsContent value="php">
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                  <code>{PHP_SNIPPET}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </div>

          {/* Payload example */}
          <div>
            <p className="text-sm font-medium mb-2">
              {fr.integrations.secretModal.payloadExample}
            </p>
            <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
              <code>{PAYLOAD_EXAMPLE}</code>
            </pre>
          </div>

          {/* Stripe mapping note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {fr.integrations.secretModal.stripeMapping}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {fr.integrations.secretModal.closeCta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
