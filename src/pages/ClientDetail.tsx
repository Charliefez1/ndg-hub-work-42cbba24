import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganisation, useUpdateOrganisation, useContacts, useCreateContact, useDeleteContact } from '@/hooks/useOrganisations';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useContracts } from '@/hooks/useContracts';
import { useEmails } from '@/hooks/useEmails';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Star, Trash2, Send, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses, formatStatus } from '@/lib/status-colors';

const ORG_STATUSES = ['active', 'inactive', 'prospect', 'archived'];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useOrganisation(id);
  const { data: contacts } = useContacts(id);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const { data: allProjects } = useProjects();
  const { data: allInvoices } = useInvoices();
  const { data: allContracts } = useContracts({ organisationId: id });
  const { data: allEmails } = useEmails();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [invitingContact, setInvitingContact] = useState<string | null>(null);

  const projects = allProjects?.filter((p) => p.organisation_id === id) ?? [];
  const invoices = allInvoices?.filter((i) => i.organisation_id === id) ?? [];
  const contracts = allContracts ?? [];
  const emails = allEmails?.filter((e: any) => e.organisation_id === id) ?? [];

  const { data: activity } = useQuery({
    queryKey: ['activity', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .or(`metadata->>organisation_id.eq.${id},entity_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const handleInviteToPortal = async (contactEmail: string, contactId: string) => {
    if (!contactEmail) { toast.error('Contact needs an email address'); return; }
    setInvitingContact(contactId);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: contactEmail,
        options: {
          shouldCreateUser: true,
          data: { role: 'client', display_name: contactEmail },
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });
      if (authError) throw authError;
      toast.success(`Magic link sent to ${contactEmail}`);
    } catch (err: any) { toast.error(err.message); }
    finally { setInvitingContact(null); }
  };

  if (isLoading) return <AppShell><Skeleton className="h-8 w-48" /></AppShell>;
  if (!org) return <AppShell><p className="text-muted-foreground">Client not found.</p></AppShell>;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/clients" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{org.name}</h1>
          <Badge variant={org.status === 'active' ? 'default' : 'secondary'} className="capitalize">{org.status}</Badge>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setEditOrgOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-3">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-caption">Sector</span><p>{org.sector ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Email</span><p>{org.email ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Phone</span><p>{org.phone ?? '—'}</p></div>
                <div><span className="text-muted-foreground text-caption">Website</span><p>{org.website ?? '—'}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground text-caption">Address</span><p>{org.address ?? '—'}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground text-caption">Notes</span><p className="whitespace-pre-wrap">{org.notes ?? '—'}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-3 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setContactDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
            </div>
            {!contacts?.length ? (
              <p className="text-muted-foreground text-center py-4">No contacts yet.</p>
            ) : (
              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Portal</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {c.name}
                            {c.is_primary && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}
                          </div>
                        </TableCell>
                        <TableCell>{c.job_title ?? '—'}</TableCell>
                        <TableCell>{c.email ?? '—'}</TableCell>
                        <TableCell>{c.phone ?? '—'}</TableCell>
                        <TableCell>
                          {c.email ? (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleInviteToPortal(c.email!, c.id)} disabled={invitingContact === c.id}>
                              <Send className="h-3 w-3 mr-1" />
                              {invitingContact === c.id ? 'Sending…' : 'Invite'}
                            </Button>
                          ) : (
                            <span className="text-caption text-muted-foreground">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await deleteContact.mutateAsync(c.id); toast.success('Contact deleted'); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-3">
            {!projects.length ? <p className="text-muted-foreground text-center py-4">No projects for this client.</p> : (
              <div className="space-y-1.5">
                {projects.map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="block bg-card rounded-lg border p-3 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{p.name}</p>
                      <Badge className={getStatusBadgeClasses(p.status, 'project')}>{formatStatus(p.status)}</Badge>
                    </div>
                    <p className="text-caption text-muted-foreground mt-1">{p.start_date ?? 'No dates'}</p>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="mt-3">
            {!contracts.length ? <p className="text-muted-foreground text-center py-4">No contracts for this client.</p> : (
              <div className="space-y-1.5">
                {contracts.map((c: any) => (
                  <div key={c.id} className="bg-card rounded-lg border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-caption text-muted-foreground">
                        {c.type} {c.value ? `· £${Number(c.value).toLocaleString()}` : ''} {c.start_date ? `· ${c.start_date}` : ''}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeClasses(c.status ?? 'draft', 'contract')}>{formatStatus(c.status ?? 'draft')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-3">
            {!invoices.length ? <p className="text-muted-foreground text-center py-4">No invoices for this client.</p> : (
              <div className="space-y-1.5">
                {invoices.map((inv) => (
                  <div key={inv.id} className="bg-card rounded-lg border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium font-mono">{inv.invoice_number}</p>
                      <p className="text-caption text-muted-foreground">{(inv as any).projects?.name} · £{Number(inv.total).toLocaleString()}</p>
                    </div>
                    <Badge className={getStatusBadgeClasses(inv.status, 'invoice')}>{inv.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="emails" className="mt-3">
            {!emails.length ? <p className="text-muted-foreground text-center py-4">No email threads linked to this client.</p> : (
              <div className="space-y-1.5">
                {emails.map((e: any) => (
                  <div key={e.id} className="bg-card rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{e.subject ?? '(no subject)'}</p>
                      <span className="text-caption text-muted-foreground shrink-0 ml-2">
                        {e.received_at ? new Date(e.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                      </span>
                    </div>
                    <p className="text-caption text-muted-foreground truncate">{e.from_address}</p>
                    {e.snippet && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.snippet}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-3">
            {!activity?.length ? <p className="text-muted-foreground text-center py-4">No activity recorded yet.</p> : (
              <div className="space-y-1.5">
                {activity.map((a) => (
                  <div key={a.id} className="bg-card rounded-lg border p-3 flex items-center justify-between">
                    <div><p className="text-sm"><span className="font-medium">{a.action}</span> on {a.entity_type}</p></div>
                    <span className="text-caption text-muted-foreground">
                      {new Date(a.created_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddContactDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen} organisationId={id!} onCreate={createContact} />
      <EditOrgDialog open={editOrgOpen} onOpenChange={setEditOrgOpen} org={org} />
    </AppShell>
  );
}

function EditOrgDialog({ open, onOpenChange, org }: { open: boolean; onOpenChange: (o: boolean) => void; org: any }) {
  const updateOrg = useUpdateOrganisation();
  const [name, setName] = useState(org.name);
  const [sector, setSector] = useState(org.sector ?? '');
  const [email, setEmail] = useState(org.email ?? '');
  const [phone, setPhone] = useState(org.phone ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [address, setAddress] = useState(org.address ?? '');
  const [status, setStatus] = useState(org.status ?? 'active');
  const [notes, setNotes] = useState(org.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrg.mutateAsync({
        id: org.id, name, status,
        sector: sector || null, email: email || null,
        phone: phone || null, website: website || null,
        address: address || null, notes: notes || null,
      });
      toast.success('Client updated');
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Client</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ORG_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sector</Label><Input value={sector} onChange={(e) => setSector(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateOrg.isPending}>{updateOrg.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddContactDialog({ open, onOpenChange, organisationId, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; organisationId: string; onCreate: ReturnType<typeof useCreateContact> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreate.mutateAsync({ organisation_id: organisationId, name, email: email || null, phone: phone || null, job_title: jobTitle || null, is_primary: isPrimary });
      toast.success('Contact added');
      onOpenChange(false);
      setName(''); setEmail(''); setPhone(''); setJobTitle(''); setIsPrimary(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div><Label>Job Title</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            Primary contact
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={onCreate.isPending}>Add</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
