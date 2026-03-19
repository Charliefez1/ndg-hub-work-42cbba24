import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, type Contract } from '@/hooks/useContracts';
import { useOrganisations } from '@/hooks/useOrganisations';
import { useProjects } from '@/hooks/useProjects';
import { Plus, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';

const CONTRACT_TYPES = ['master', 'project', 'sow', 'amendment'];
const CONTRACT_STATUSES = ['draft', 'sent', 'signed', 'active', 'expired', 'terminated', 'cancelled'];

export default function Contracts() {
  const { data: contracts, isLoading } = useContracts();
  const deleteContract = useDeleteContract();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contract?')) return;
    try { await deleteContract.mutateAsync(id); toast.success('Contract deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Contracts</h1>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> New Contract</Button>
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
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeClasses(c.status ?? 'draft', 'contract')}>{formatStatus(c.status ?? 'draft')}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingContract(c)}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ContractDialog open={createOpen} onOpenChange={setCreateOpen} contract={null} />
      {editingContract && (
        <ContractDialog open={!!editingContract} onOpenChange={(o) => { if (!o) setEditingContract(null); }} contract={editingContract} />
      )}
    </AppShell>
  );
}

function ContractDialog({ open, onOpenChange, contract }: { open: boolean; onOpenChange: (o: boolean) => void; contract: Contract | null }) {
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: orgs } = useOrganisations();
  const { data: projects } = useProjects();
  const isEdit = !!contract;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title') as string,
      type: fd.get('type') as string,
      organisation_id: fd.get('organisation_id') as string,
      project_id: (fd.get('project_id') as string) || null,
      status: (fd.get('status') as string) || 'draft',
      value: Number(fd.get('value')) || null,
      start_date: (fd.get('start_date') as string) || null,
      end_date: (fd.get('end_date') as string) || null,
    };
    try {
      if (isEdit) {
        await updateContract.mutateAsync({ id: contract.id, ...payload });
        toast.success('Contract updated');
      } else {
        await createContract.mutateAsync(payload);
        toast.success('Contract created');
      }
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Contract' : 'New Contract'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Title</Label><Input name="title" required defaultValue={contract?.title ?? ''} className="mt-1" /></div>
          <div><Label>Type</Label>
            <Select name="type" defaultValue={contract?.type ?? 'project'}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Client</Label>
            <Select name="organisation_id" defaultValue={contract?.organisation_id ?? ''} required>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Project</Label>
            <Select name="project_id" defaultValue={contract?.project_id ?? ''}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Status</Label>
            <Select name="status" defaultValue={contract?.status ?? 'draft'}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Value (£)</Label><Input name="value" type="number" defaultValue={contract?.value?.toString() ?? ''} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Start Date</Label><Input name="start_date" type="date" defaultValue={contract?.start_date ?? ''} className="mt-1" /></div>
            <div><Label>End Date</Label><Input name="end_date" type="date" defaultValue={contract?.end_date ?? ''} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createContract.isPending || updateContract.isPending}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
