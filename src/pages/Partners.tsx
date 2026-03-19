import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner, type Partner } from '@/hooks/usePartners';
import { Plus, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PARTNER_TYPES = ['referral', 'delivery', 'technology', 'content', 'other'];

export default function Partners() {
  const { data: partners, isLoading } = usePartners();
  const deletePartner = useDeletePartner();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    try { await deletePartner.mutateAsync(id); toast.success('Partner deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Partners</h1>
          <Button size="sm" onClick={() => { setEditingPartner(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Partner
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading…</p>
        ) : !partners?.length ? (
          <p className="text-muted-foreground text-center py-4">No partners yet.</p>
        ) : (
          <div className="space-y-1.5">
            {partners.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">{p.name}</p>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1">
                      {p.contact_email ?? '—'}
                      {p.commission_rate ? ` · ${p.commission_rate}% commission` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.type && <Badge variant="secondary">{p.type}</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingPartner(p); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PartnerDialog
        key={editingPartner?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
      />
    </AppShell>
  );
}

function PartnerDialog({ open, onOpenChange, partner }: { open: boolean; onOpenChange: (o: boolean) => void; partner: Partner | null }) {
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const isEdit = !!partner;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name') as string,
      type: (fd.get('type') as string) || null,
      contact_email: (fd.get('contact_email') as string) || null,
      commission_rate: Number(fd.get('commission_rate')) || null,
    };
    try {
      if (isEdit) {
        await updatePartner.mutateAsync({ id: partner.id, ...payload });
        toast.success('Partner updated');
      } else {
        await createPartner.mutateAsync(payload);
        toast.success('Partner created');
      }
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Partner' : 'New Partner'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name</Label><Input name="name" required defaultValue={partner?.name ?? ''} className="mt-1" /></div>
          <div><Label>Type</Label>
            <Select name="type" defaultValue={partner?.type ?? 'referral'}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{PARTNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Contact Email</Label><Input name="contact_email" type="email" defaultValue={partner?.contact_email ?? ''} className="mt-1" /></div>
          <div><Label>Commission Rate (%)</Label><Input name="commission_rate" type="number" step="0.01" defaultValue={partner?.commission_rate?.toString() ?? ''} className="mt-1" /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createPartner.isPending || updatePartner.isPending}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
