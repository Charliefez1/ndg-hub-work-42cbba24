import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartners, useCreatePartner } from '@/hooks/usePartners';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

const PARTNER_TYPES = ['referral', 'delivery', 'technology', 'content', 'other'];

export default function Partners() {
  const { data: partners, isLoading } = usePartners();
  const createPartner = useCreatePartner();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createPartner.mutateAsync({
        name: fd.get('name') as string,
        type: (fd.get('type') as string) || null,
        contact_email: (fd.get('contact_email') as string) || null,
        commission_rate: Number(fd.get('commission_rate')) || null,
      });
      toast.success('Partner created');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Partners</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Partner</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Partner</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-md">
                <div><Label>Name</Label><Input name="name" required className="mt-1" /></div>
                <div><Label>Type</Label>
                  <Select name="type" defaultValue="referral">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARTNER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Contact Email</Label><Input name="contact_email" type="email" className="mt-1" /></div>
                <div><Label>Commission Rate (%)</Label><Input name="commission_rate" type="number" step="0.01" className="mt-1" /></div>
                <Button type="submit" disabled={createPartner.isPending} className="w-full">Create Partner</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-text-2 text-center py-lg">Loading…</p>
        ) : !partners?.length ? (
          <p className="text-text-2 text-center py-lg">No partners yet.</p>
        ) : (
          <div className="space-y-xs">
            {partners.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-md flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-text-3" />
                      <p className="font-medium text-body">{p.name}</p>
                    </div>
                    <p className="text-caption text-text-3 mt-1">
                      {p.contact_email ?? '—'}
                      {p.commission_rate ? ` · ${p.commission_rate}% commission` : ''}
                    </p>
                  </div>
                  {p.type && <Badge variant="secondary">{p.type}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
