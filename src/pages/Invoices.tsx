import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInvoices, useUpdateInvoice } from '@/hooks/useInvoices';
import { FileText, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { toast } from 'sonner';
import { Pagination, usePagination } from '@/components/shared/Pagination';
import { formatDate, formatGBP } from '@/lib/format';

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const updateInvoice = useUpdateInvoice();
  const [page, setPage] = useState(1);

  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const totalOutstanding = invoices?.filter((i) => i.status === 'sent').reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const totalDraft = invoices?.filter((i) => i.status === 'draft').length ?? 0;

  const allInvoices = invoices ?? [];
  const { paginated, total } = usePagination(allInvoices, page);

  const markPaid = async (id: string) => {
    await updateInvoice.mutateAsync({ id, status: 'paid', paid_date: new Date().toISOString().split('T')[0] });
    toast.success('Invoice marked as paid');
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Invoices</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Revenue (Paid)</p>
            <p className="text-section-title text-green-600">£{totalRevenue.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Outstanding</p>
            <p className="text-section-title text-amber-600">£{totalOutstanding.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-caption text-muted-foreground">Drafts</p>
            <p className="text-section-title">{totalDraft}</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !invoices?.length ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">No invoices yet. Invoices are generated from project deliveries.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{(inv as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell>{(inv as any).projects?.name ?? '—'}</TableCell>
                    <TableCell>£{Number(inv.total).toLocaleString()}</TableCell>
                    <TableCell><Badge className={getStatusBadgeClasses(inv.status, 'invoice')}>{inv.status}</Badge></TableCell>
                    <TableCell>{inv.due_date ?? '—'}</TableCell>
                    <TableCell>
                      {inv.status === 'sent' && (
                        <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)}>Mark Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
