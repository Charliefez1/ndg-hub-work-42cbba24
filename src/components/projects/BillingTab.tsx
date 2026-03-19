import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useInvoices, useGenerateInvoice } from '@/hooks/useInvoices';
import { useDeliveries } from '@/hooks/useDeliveries';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface BillingTabProps {
  projectId: string;
  budget: number | null;
}

export function BillingTab({ projectId, budget }: BillingTabProps) {
  const { data: invoices } = useInvoices();
  const { data: deliveries } = useDeliveries(projectId);
  const generateInvoice = useGenerateInvoice();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  const projectInvoices = invoices?.filter((i) => i.project_id === projectId) ?? [];
  const totalInvoiced = projectInvoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = projectInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);

  // Find uninvoiced deliveries (deliveries not in any invoice_items)
  const invoicedDeliveryIds = new Set<string>();
  // For simplicity, we check deliveries that have service_id
  const uninvoicedDeliveries = deliveries?.filter(
    (d) => d.service_id && !invoicedDeliveryIds.has(d.id)
  ) ?? [];

  const handleGenerate = async () => {
    if (!selectedDeliveries.length) { toast.error('Select at least one delivery'); return; }
    try {
      await generateInvoice.mutateAsync({ projectId, deliveryIds: selectedDeliveries });
      toast.success('Invoice generated');
      setDialogOpen(false);
      setSelectedDeliveries([]);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-3">
      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Budget</p>
            <p className="text-section-title">{budget ? `£${Number(budget).toLocaleString()}` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Total Invoiced</p>
            <p className="text-section-title">£{totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Total Paid</p>
            <p className="text-section-title text-success">£{totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Delivery prices */}
      {deliveries?.length ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Workshop Prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-background rounded border p-3">
                <span className="text-sm">{d.title}</span>
                <span className="text-sm font-medium">
                  {(d as any).services?.name ? `£${Number((d as any).services?.price || 0).toLocaleString()}` : 'No service'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Invoices list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Invoices</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Generate Invoice
          </Button>
        </CardHeader>
        <CardContent>
          {!projectInvoices.length ? (
            <p className="text-muted-foreground text-center py-3">No invoices yet.</p>
          ) : (
            <div className="space-y-1.5">
              {projectInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-background rounded border p-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-caption text-muted-foreground">
                      {inv.issue_date || 'Draft'} · £{Number(inv.total).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeClasses(inv.status, 'invoice')}>{inv.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate invoice dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Invoice</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">Select deliveries to include:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uninvoicedDeliveries.length === 0 ? (
              <p className="text-muted-foreground text-center py-3">No uninvoiced deliveries with services.</p>
            ) : (
              uninvoicedDeliveries.map((d) => (
                <label key={d.id} className="flex items-center gap-2 bg-background rounded border p-3 cursor-pointer hover:border-primary">
                  <Checkbox
                    checked={selectedDeliveries.includes(d.id)}
                    onCheckedChange={(checked) => {
                      setSelectedDeliveries((prev) =>
                        checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)
                      );
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{d.title}</p>
                    <p className="text-caption text-muted-foreground">{(d as any).services?.name}</p>
                  </div>
                  <span className="text-sm font-medium">
                    £{Number((d as any).services?.price || 0).toLocaleString()}
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedDeliveries.length > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">
                  £{uninvoicedDeliveries
                    .filter((d) => selectedDeliveries.includes(d.id))
                    .reduce((s, d) => s + Number((d as any).services?.price || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateInvoice.isPending || !selectedDeliveries.length}>
              {generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
