import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts, useCreateContract } from '@/hooks/useContracts';
import { useOrganisations } from '@/hooks/useOrganisations';
import { Plus, FileSignature } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeClasses } from '@/lib/status-colors';

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Contracts</h1>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Contract
          </Button>
        </div>

        {!contracts?.length ? (
          <div className="text-center py-xl">
            <FileSignature className="h-10 w-10 text-text-3 mx-auto mb-3" />
            <p className="text-text-2">No contracts yet.</p>
          </div>
        ) : (
          <div className="space-y-xs">
            {contracts.map((c) => (
              <Card key={c.id} className="hover:border-primary transition-colors">
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-body">{c.title}</p>
                    <p className="text-caption text-text-3">
                      {(c as any).organisations?.name} · {c.type}
                      {c.value ? ` · £${Number(c.value).toLocaleString()}` : ''}
                    </p>
                    <p className="text-caption text-text-3">
                      {c.start_date ?? '—'} → {c.end_date ?? '—'}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeClasses(c.status ?? 'draft', 'project')}>{c.status ?? 'draft'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddContractDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

function AddContractDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createContract = useCreateContract();
  const { data: orgs } = useOrganisations();
  const [title, setTitle] = useState('');
  const [orgId, setOrgId] = useState('');
  const [type, setType] = useState('master');
  const [value, setValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContract.mutateAsync({
        title,
        organisation_id: orgId,
        type,
        value: value ? Number(value) : null,
      });
      toast.success('Contract created');
      onOpenChange(false);
      setTitle(''); setOrgId(''); setValue('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div>
            <Label>Client *</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="sow">SOW</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Value (£)</Label><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createContract.isPending || !orgId}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
