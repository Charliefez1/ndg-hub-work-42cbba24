import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts, useCreateContract } from '@/hooks/useContracts';
import { useOrganisations } from '@/hooks/useOrganisations';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeClasses } from '@/lib/status-colors';

const CONTRACT_TYPES = ['master', 'project', 'sow', 'amendment'];
const CONTRACT_STATUSES = ['draft', 'sent', 'signed', 'active', 'expired', 'terminated'];

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const { data: orgs } = useOrganisations();
  const createContract = useCreateContract();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createContract.mutateAsync({
        title: fd.get('title') as string,
        type: fd.get('type') as string,
        organisation_id: fd.get('organisation_id') as string,
        status: (fd.get('status') as string) || 'draft',
        value: Number(fd.get('value')) || null,
        start_date: (fd.get('start_date') as string) || null,
        end_date: (fd.get('end_date') as string) || null,
      });
      toast.success('Contract created');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Contracts</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Contract</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div><Label>Title</Label><Input name="title" required className="mt-1" /></div>
                <div><Label>Type</Label>
                  <Select name="type" defaultValue="project">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Client</Label>
                  <Select name="organisation_id" required>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value (£)</Label><Input name="value" type="number" className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Start Date</Label><Input name="start_date" type="date" className="mt-1" /></div>
                  <div><Label>End Date</Label><Input name="end_date" type="date" className="mt-1" /></div>
                </div>
                <Button type="submit" disabled={createContract.isPending} className="w-full">Create Contract</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading…</p>
        ) : !contracts?.length ? (
          <p className="text-muted-foreground text-center py-4">No contracts yet.</p>
        ) : (
          <div className="space-y-1.5">
            {contracts.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{c.title}</p>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1">
                      {(c as any).organisations?.name} · {c.type}
                      {c.value ? ` · £${Number(c.value).toLocaleString()}` : ''}
                      {c.start_date ? ` · ${c.start_date}` : ''}
                      {c.end_date ? ` → ${c.end_date}` : ''}
                    </p>
                  </div>
                  <Badge variant="secondary">{c.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
