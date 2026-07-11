import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getProductMappings, getPricesFromStripe, upsertProductMapping } from '@/lib/api/stripe-mappings';
import type { StripePrice, StripeProductMapping, PlanTier } from '@/lib/types/stripe-mappings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';

interface RowState {
  price: StripePrice;
  planTier: PlanTier | null;
  seatLimitInput: string;
  unlimitedSeats: boolean;
  inUse: boolean;
  alreadyMapped: boolean;
  seatError: string | null;
  saving: boolean;
}

function buildRows(prices: StripePrice[], mappings: StripeProductMapping[]): RowState[] {
  const mappingByPriceId = new Map<string, StripeProductMapping>();
  for (const m of mappings) {
    mappingByPriceId.set(m.stripe_price_id, m);
  }

  return prices.map((price) => {
    const mapping = mappingByPriceId.get(price.stripe_price_id);
    return {
      price,
      planTier: mapping?.plan_tier ?? null,
      seatLimitInput: mapping?.seat_limit != null ? String(mapping.seat_limit) : '',
      unlimitedSeats: mapping?.unlimited_seats ?? false,
      inUse: mapping?.in_use ?? false,
      alreadyMapped: price.already_mapped,
      seatError: null,
      saving: false,
    };
  });
}

export default function ProductMappingTable() {
  const fr = useT();
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [prices, mappings] = await Promise.all([
          getPricesFromStripe(),
          getProductMappings(),
        ]);
        if (!cancelled) {
          setRows(buildRows(prices, mappings));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Loading error');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function updateRow(priceId: string, patch: Partial<RowState>) {
    setRows(prev => prev.map(r =>
      r.price.stripe_price_id === priceId ? { ...r, ...patch } : r,
    ));
  }

  async function handleSave(row: RowState) {
    const priceId = row.price.stripe_price_id;

    let seatLimit: number | null = null;
    if (!row.unlimitedSeats) {
      if (row.seatLimitInput.trim() !== '') {
        const parsed = parseInt(row.seatLimitInput, 10);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          updateRow(priceId, { seatError: fr.settings.plans.seatLimitError });
          return;
        }
        seatLimit = parsed;
      }
    }

    updateRow(priceId, { seatError: null, saving: true });

    try {
      const saved = await upsertProductMapping({
        stripe_price_id: priceId,
        plan_tier: row.planTier,
        seat_limit: seatLimit,
        unlimited_seats: row.unlimitedSeats,
        stripe_product_name: row.price.stripe_product_name,
        stripe_price_label: row.price.stripe_price_label,
      });
      updateRow(priceId, {
        saving: false,
        alreadyMapped: true,
        inUse: saved.in_use ?? row.inUse,
        seatLimitInput: saved.seat_limit != null ? String(saved.seat_limit) : '',
        unlimitedSeats: saved.unlimited_seats,
        planTier: saved.plan_tier,
      });
      toast.success(fr.settings.plans.saveSuccess);
    } catch (err) {
      updateRow(priceId, { saving: false });
      toast.error(err instanceof Error ? err.message : fr.settings.plans.saveError);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive">{loadError}</p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{fr.settings.plans.emptyState}</p>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{fr.settings.plans.colProduct}</TableHead>
            <TableHead>{fr.settings.plans.colPrice}</TableHead>
            <TableHead>{fr.settings.plans.colInterval}</TableHead>
            <TableHead>{fr.settings.plans.colPlanTier}</TableHead>
            <TableHead>{fr.settings.plans.colSeats}</TableHead>
            <TableHead>{fr.settings.plans.colStatus}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => {
            const priceId = row.price.stripe_price_id;
            return (
              <TableRow key={priceId}>
                {/* Produit */}
                <TableCell className="font-medium text-sm">
                  {row.price.stripe_product_name}
                </TableCell>

                {/* Tarif */}
                <TableCell className="text-sm text-muted-foreground">
                  {row.price.stripe_price_label}
                </TableCell>

                {/* Intervalle */}
                <TableCell className="text-sm">
                  {row.price.recurring_interval === 'month'
                    ? fr.settings.plans.intervalMonth
                    : fr.settings.plans.intervalYear}
                </TableCell>

                {/* Plan Sentio */}
                <TableCell className="min-w-[160px]">
                  <Select
                    value={row.planTier ?? 'null'}
                    onValueChange={(val) =>
                      updateRow(priceId, { planTier: val === 'null' ? null : val as PlanTier })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">{fr.settings.plans.planUndefined}</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Sièges max */}
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-24 text-sm"
                        placeholder={fr.settings.plans.seatPlaceholder}
                        value={row.unlimitedSeats ? '' : row.seatLimitInput}
                        disabled={row.unlimitedSeats}
                        onChange={(e) =>
                          updateRow(priceId, { seatLimitInput: e.target.value, seatError: null })
                        }
                      />
                      <Switch
                        checked={row.unlimitedSeats}
                        onCheckedChange={(checked) =>
                          updateRow(priceId, {
                            unlimitedSeats: checked,
                            seatLimitInput: checked ? '' : row.seatLimitInput,
                            seatError: null,
                          })
                        }
                      />
                      <span className={`text-sm ${row.unlimitedSeats ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {fr.settings.plans.unlimited}
                      </span>
                    </div>
                    {row.seatError && (
                      <p className="text-xs text-destructive">{row.seatError}</p>
                    )}
                  </div>
                </TableCell>

                {/* Statut */}
                <TableCell>
                  {row.inUse ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      {fr.settings.plans.statusActive}
                    </Badge>
                  ) : row.alreadyMapped ? (
                    <Badge variant="secondary">
                      {fr.settings.plans.statusConfigured}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning">
                      {fr.settings.plans.statusUnconfigured}
                    </Badge>
                  )}
                </TableCell>

                {/* Action */}
                <TableCell>
                  <Button
                    size="sm"
                    disabled={row.saving}
                    onClick={() => handleSave(row)}
                  >
                    {row.saving ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        {fr.settings.plans.saving}
                      </>
                    ) : (
                      fr.settings.plans.save
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
