import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { Link } from 'react-router-dom';

export default function Portal() {
  const { profile, signOut, user } = useAuth();

  // Get portal access to find org
  const { data: access } = useQuery({
    queryKey: ['portal-access', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('client_portal_access').select('*, organisations(name)').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });

  const orgIds = access?.map((a) => a.organisation_id) ?? [];

  const { data: projects } = useQuery({
    queryKey: ['portal-projects', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').in('organisation_id', orgIds).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ['portal-deliveries', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('deliveries').select('*').in('organisation_id', orgIds).order('delivery_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['portal-invoices', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, projects(name)').in('organisation_id', orgIds).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30">
        <span className="font-satoshi text-lg font-bold">NDG Hub — Client Portal</span>
        <div className="flex items-center gap-md">
          <span className="text-body text-text-2">{profile?.display_name}</span>
          <button onClick={signOut} className="text-sm text-text-3 hover:text-foreground transition-colors">Sign Out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-lg space-y-lg">
        <h1 className="text-page-title">Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>

        {!access?.length ? (
          <Card>
            <CardContent className="pt-6 text-center text-text-2">
              <p>No portal access configured yet. Please contact your account manager.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">Projects ({projects?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="workshops">Workshops ({deliveries?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length ?? 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-md">
              {!projects?.length ? <p className="text-text-2 text-center py-lg">No projects found.</p> : (
                <div className="space-y-xs">
                  {projects.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-caption text-text-3">{p.start_date ?? 'No start date'} — {p.end_date ?? 'Ongoing'}</p>
                        </div>
                        <Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace('_', ' ')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workshops" className="mt-md">
              {!deliveries?.length ? <p className="text-text-2 text-center py-lg">No workshops found.</p> : (
                <div className="space-y-xs">
                  {deliveries.map((d) => (
                    <Card key={d.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{d.title}</p>
                          <p className="text-caption text-text-3">{d.delivery_date ?? 'Date TBD'} · {d.location ?? 'Location TBD'}</p>
                        </div>
                        <Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status.replace('_', ' ')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-md">
              {!invoices?.length ? <p className="text-text-2 text-center py-lg">No invoices found.</p> : (
                <div className="rounded-lg border bg-surface overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                          <TableCell>{(inv as any).projects?.name ?? '—'}</TableCell>
                          <TableCell>£{Number(inv.total).toLocaleString()}</TableCell>
                          <TableCell><Badge className={getStatusBadgeClasses(inv.status, 'invoice')}>{inv.status}</Badge></TableCell>
                          <TableCell>{inv.due_date ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
