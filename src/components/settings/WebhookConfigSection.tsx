import { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  TestTube,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useT } from '@/lib/i18n/useT';
import { WEBHOOK_EVENT_TYPES } from '@/lib/types/webhook';
import type { WebhookConfig, WebhookEventType } from '@/lib/types/webhook';
import {
  useWebhookConfig,
  useUpsertWebhook,
  useTestWebhook,
  useRegenerateWebhookSecret,
  useDisableWebhook,
} from '@/hooks/useWebhook';
import WebhookSecretModal from './WebhookSecretModal';

const SECRET_VISIBLE_TIMEOUT_MS = 30_000;

function PrerequisiteBanner() {
  const fr = useT();
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            {fr.integrations.prerequisite.title}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {fr.integrations.prerequisite.description}
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>{fr.integrations.prerequisite.brevo}</li>
            <li>{fr.integrations.prerequisite.klaviyo}</li>
            <li>{fr.integrations.prerequisite.activeCampaign}</li>
          </ul>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {fr.integrations.prerequisite.otherTool}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {fr.integrations.prerequisite.otherToolDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfiguredState({ config }: { config: WebhookConfig }) {
  const fr = useT();
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState(config.endpoint_url);
  const [newEvents, setNewEvents] = useState<WebhookEventType[]>(config.active_events);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const upsertMutation = useUpsertWebhook();
  const testMutation = useTestWebhook();
  const regenerateMutation = useRegenerateWebhookSecret();
  const disableMutation = useDisableWebhook();

  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Auto-hide secret after timeout
  useEffect(() => {
    if (!secretVisible) return;
    const timer = setTimeout(() => setSecretVisible(false), SECRET_VISIBLE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [secretVisible]);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(config.secret_prefix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencieux
    }
  };

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.success && data.status_code != null && data.latency_ms != null) {
          setTestResult({
            success: true,
            message: fr.integrations.webhook.testSuccess(data.status_code, data.latency_ms),
          });
        } else {
          setTestResult({
            success: false,
            message: data.error ?? fr.integrations.webhook.testFailed,
          });
        }
      },
      onError: (e) => {
        setTestResult({ success: false, message: e.message });
      },
    });
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setNewSecret(data.new_secret);
        setConfirmRegenerate(false);
      },
    });
  };

  const handleDisable = () => {
    disableMutation.mutate(undefined, {
      onSuccess: () => setConfirmDisable(false),
    });
  };

  const handleSaveUrl = () => {
    upsertMutation.mutate(
      { endpoint_url: newUrl, active_events: newEvents },
      { onSuccess: () => setEditingUrl(false) },
    );
  };

  const toggleEvent = useCallback(
    (event: WebhookEventType) => {
      setNewEvents((prev) =>
        prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
      );
    },
    [],
  );

  const hasErrors = config.failure_count > 0;
  const lastTriggeredText = config.last_triggered_at
    ? formatDistanceToNow(new Date(config.last_triggered_at), { addSuffix: true, locale: enUS })
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              {fr.integrations.webhookUniversal}
            </CardTitle>
            {hasErrors ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {fr.integrations.webhook.recentFailures(config.failure_count)}
              </Badge>
            ) : config.is_active ? (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {fr.integrations.webhook.active}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error banner */}
          {hasErrors && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30 p-3 space-y-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {fr.integrations.webhook.lastError} : {config.last_error_message ?? 'Timeout'}
                {lastTriggeredText ? ` (${lastTriggeredText})` : ''}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {fr.integrations.webhook.disableWarning}
              </p>
            </div>
          )}

          {/* URL */}
          <div className="space-y-1">
            <p className="text-sm font-medium">URL</p>
            {editingUrl ? (
              <div className="flex gap-2">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleSaveUrl}
                  disabled={upsertMutation.isPending || !newUrl.trim()}
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    fr.common.save
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingUrl(false); setNewUrl(config.endpoint_url); }}>
                  {fr.common.cancel}
                </Button>
              </div>
            ) : (
              <p className="text-sm font-mono text-muted-foreground break-all">
                {config.endpoint_url}
              </p>
            )}
          </div>

          {/* Secret */}
          <div className="space-y-1">
            <p className="text-sm font-medium">{fr.integrations.webhook.secret}</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-muted-foreground">
                {secretVisible ? config.secret_prefix : config.secret_prefix.slice(0, 14) + '...'}
              </code>
              <Button variant="ghost" size="sm" onClick={() => setSecretVisible(!secretVisible)}>
                {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1">{secretVisible ? fr.integrations.webhook.hide : fr.integrations.webhook.show}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopySecret}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? fr.integrations.webhook.copied : fr.integrations.webhook.copy}</span>
              </Button>
            </div>
          </div>

          {/* Last execution */}
          {lastTriggeredText && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{fr.integrations.webhook.lastExecution}</p>
              <p className="text-sm text-muted-foreground">
                {lastTriggeredText}
                {config.last_status_code != null && (
                  <span className={config.last_status_code < 400 ? 'text-emerald-600 ml-2' : 'text-destructive ml-2'}>
                    {config.last_status_code < 400 ? (
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="inline h-3 w-3 mr-1" />
                    )}
                    {config.last_status_code}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Active events */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{fr.integrations.webhook.activeEvents}</p>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENT_TYPES.map((evt) => (
                <label key={evt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={newEvents.includes(evt)}
                    onCheckedChange={() => toggleEvent(evt)}
                  />
                  {fr.integrations.events[evt]}
                </label>
              ))}
            </div>
            {/* Save events if changed */}
            {JSON.stringify(newEvents.slice().sort()) !== JSON.stringify(config.active_events.slice().sort()) && (
              <Button
                size="sm"
                onClick={() => upsertMutation.mutate({ endpoint_url: config.endpoint_url, active_events: newEvents })}
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {fr.common.save}
              </Button>
            )}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-lg p-3 text-sm ${testResult.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'}`}>
              {testResult.success ? <CheckCircle className="inline h-4 w-4 mr-1" /> : <XCircle className="inline h-4 w-4 mr-1" />}
              {testResult.message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testMutation.isPending}>
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <TestTube className="h-4 w-4 mr-1" />
              )}
              {testMutation.isPending ? fr.integrations.webhook.testing : fr.integrations.webhook.testConnection}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmRegenerate(true)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {fr.integrations.webhook.regenerateSecret}
            </Button>
            {!editingUrl && (
              <Button variant="outline" size="sm" onClick={() => setEditingUrl(true)}>
                {fr.integrations.webhook.editUrl}
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDisable(true)}>
              {fr.integrations.webhook.disable}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm regenerate dialog */}
      <AlertDialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr.integrations.webhook.confirmRegenerate}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr.integrations.webhook.confirmRegenerateDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={regenerateMutation.isPending}>
              {regenerateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {fr.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm disable dialog */}
      <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr.integrations.webhook.confirmDisable}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr.integrations.webhook.confirmDisableDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disableMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {fr.integrations.webhook.disable}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New secret modal (after regeneration) */}
      {newSecret && (
        <WebhookSecretModal
          open={!!newSecret}
          onOpenChange={() => setNewSecret(null)}
          secret={newSecret}
        />
      )}
    </>
  );
}

function UnconfiguredState() {
  const fr = useT();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([...WEBHOOK_EVENT_TYPES]);
  const [secret, setSecret] = useState<string | null>(null);

  const upsertMutation = useUpsertWebhook();

  const handleConfigure = () => {
    if (!url.trim()) return;
    upsertMutation.mutate(
      { endpoint_url: url.trim(), active_events: selectedEvents },
      {
        onSuccess: (data) => {
          if (data.secret) {
            setSecret(data.secret);
          }
        },
      },
    );
  };

  const toggleEvent = (event: WebhookEventType) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {fr.integrations.webhookUniversal}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {fr.integrations.webhook.description}
          </p>
          <div>
            <label className="text-sm font-medium">{fr.integrations.webhook.endpointUrl} *</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={fr.integrations.webhook.endpointPlaceholder}
              type="url"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{fr.integrations.webhook.activeEvents}</p>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENT_TYPES.map((evt) => (
                <label key={evt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedEvents.includes(evt)}
                    onCheckedChange={() => toggleEvent(evt)}
                  />
                  {fr.integrations.events[evt]}
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleConfigure}
            disabled={upsertMutation.isPending || !url.trim()}
          >
            {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {fr.integrations.webhook.configure}
          </Button>
        </CardContent>
      </Card>

      {secret && (
        <WebhookSecretModal
          open={!!secret}
          onOpenChange={() => setSecret(null)}
          secret={secret}
        />
      )}
    </>
  );
}

export default function WebhookConfigSection() {
  const fr = useT();
  const { data: config, isLoading } = useWebhookConfig();

  return (
    <div className="space-y-4">
      <PrerequisiteBanner />

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {fr.common.loading}
            </div>
          </CardContent>
        </Card>
      ) : config?.is_active ? (
        <ConfiguredState config={config} />
      ) : (
        <UnconfiguredState />
      )}
    </div>
  );
}
