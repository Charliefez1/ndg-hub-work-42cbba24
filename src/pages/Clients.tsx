import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganisations, useCreateOrganisation } from '@/hooks/useOrganisations';
import { Plus, Search, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, usePagination } from '@/components/shared/Pagination';

export default function Clients() {
  const { data: orgs, isLoading } = useOrganisations();
  const createOrg = useCreateOrganisation();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = orgs?.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.sector?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];
  const { paginated, total } = usePagination(filtered, page);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Organisations</h1>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Client
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !filtered?.length ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">{search ? 'No clients match your search.' : 'No clients yet. Create your first client to get started.'}</p>
            {!search && <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Client</Button>}
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link to={`/clients/${o.id}`} className="font-medium text-primary hover:underline">{o.name}</Link>
                    </TableCell>
                    <TableCell>{o.sector ?? '—'}</TableCell>
                    <TableCell>{o.email ?? '—'}</TableCell>
                    <TableCell><Badge variant={o.status === 'active' ? 'default' : 'secondary'} className="capitalize">{o.status ?? 'active'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateOrgDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={createOrg} />
    </AppShell>
  );
}

function CreateOrgDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: ReturnType<typeof useCreateOrganisation> }) {
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate.mutateAsync({ name, sector: sector || null, email: email || null, phone: phone || null, website: website || null, address: address || null });
      toast.success('Client created');
      onOpenChange(false);
      setName(''); setSector(''); setEmail(''); setPhone(''); setWebsite(''); setAddress('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Client</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sector</Label><Input value={sector} onChange={(e) => setSector(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={onCreate.isPending}>{onCreate.isPending ? 'Creating...' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
