import { useOpsSelfMonitor } from '@/hooks/useOpsSelfMonitor';
import { fr } from '@/i18n/fr';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Play, Loader2, CheckCircle } from 'lucide-react';

export default function SelfMonitorTab() {
  const { mutate, isPending, data, error } = useOpsSelfMonitor();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {fr.ops.selfMonitorTitle}
          </CardTitle>
          <CardDescription>
            {fr.ops.selfMonitorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {fr.ops.selfMonitorRunning}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {fr.ops.runSelfMonitor}
              </>
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive mt-2">
              {error instanceof Error ? error.message : 'Erreur inconnue'}
            </p>
          )}
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {fr.ops.actionsTaken}
              </CardTitle>
              <Badge
                variant={data.actions_taken > 0 ? 'default' : 'outline'}
              >
                {data.actions_taken}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.actions.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {fr.ops.noActions}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.actions.map((action, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-sm">{action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              {fr.format.dateTime(data.timestamp)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
