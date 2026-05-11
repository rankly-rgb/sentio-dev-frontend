import { useT } from '@/lib/i18n/useT';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity } from 'lucide-react';
import SystemStatusTab from '@/components/ops/SystemStatusTab';
import SelfMonitorTab from '@/components/ops/SelfMonitorTab';
import DlqViewerTab from '@/components/ops/DlqViewerTab';
import CronLocksTab from '@/components/ops/CronLocksTab';
import SyncsExtendedTab from '@/components/ops/SyncsExtendedTab';

export default function Ops() {
  const fr = useT();
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-primary/60" />
        <h1 className="text-2xl font-bold">{fr.ops.title}</h1>
      </div>

      <Tabs defaultValue="health">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="health">{fr.ops.tabs.health}</TabsTrigger>
          <TabsTrigger value="self-monitor">
            {fr.ops.tabs.selfMonitor}
          </TabsTrigger>
          <TabsTrigger value="dlq">{fr.ops.tabs.dlq}</TabsTrigger>
          <TabsTrigger value="cron-locks">
            {fr.ops.tabs.cronLocks}
          </TabsTrigger>
          <TabsTrigger value="syncs-extended">
            {fr.ops.tabs.syncsExtended}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <SystemStatusTab />
        </TabsContent>
        <TabsContent value="self-monitor" className="mt-4">
          <SelfMonitorTab />
        </TabsContent>
        <TabsContent value="dlq" className="mt-4">
          <DlqViewerTab />
        </TabsContent>
        <TabsContent value="cron-locks" className="mt-4">
          <CronLocksTab />
        </TabsContent>
        <TabsContent value="syncs-extended" className="mt-4">
          <SyncsExtendedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
