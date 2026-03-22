import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { FolderKanban, Briefcase, FileText, ClipboardList, BarChart3 } from 'lucide-react';

function TabSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function Portal() {
  const { profile, signOut, user } = useAuth();

  const { data: access, isLoading: accessLoading, error: accessError } = useQuery({
    queryKey: ['portal-access', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('client_portal_access').select('*, organisations(name)').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });

  const orgIds = access?.map((a) => a.organisation_id) ?? [];

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['portal-projects', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').in('organisation_id', orgIds).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deliveries, isLoading: deliveriesLoading, error: deliveriesError } = useQuery({
    queryKey: ['portal-deliveries', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('deliveries').select('*, feedback_form_id').in('organisation_id', orgIds).order('delivery_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useQuery({
    queryKey: ['portal-invoices', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('invoices').select('*, projects(name)').in('organisation_id', orgIds).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get active feedback forms for the client's deliveries
  const { data: feedbackForms } = useQuery({
    queryKey: ['portal-feedback-forms', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const deliveryIds = deliveries?.map((d) => d.id) ?? [];
      if (!deliveryIds.length) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*, deliveries(title, delivery_date)')
        .eq('type', 'feedback')
        .eq('active', true)
        .in('delivery_id', deliveryIds);
      if (error) throw error;
      return data;
    },
  });

  const canSubmitForms = access?.some((a) => (a.permissions as any)?.can_submit_forms !== false);

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30">
          <span className="font-satoshi text-lg font-bold">NQI Hub — Client Portal</span>
        </header>
        <main className="max-w-5xl mx-auto p-6">
          <PageSkeleton variant="dashboard" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-30">
        <span className="font-satoshi text-lg font-bold">NQI Hub — Client Portal</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile?.display_name}</span>
          <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-page-title">Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}</h1>
          {access && access.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {access.map((a) => (a as any).organisations?.name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {accessError ? (
          <Card>
            <CardContent className="pt-6 text-center text-destructive">
              <p>Failed to load portal access. Please try refreshing the page.</p>
            </CardContent>
          </Card>
        ) : !access?.length ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No portal access configured yet. Please contact your account manager.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">Projects ({projects?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="workshops">Workshops ({deliveries?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length ?? 0})</TabsTrigger>
              {canSubmitForms && <TabsTrigger value="feedback">Feedback</TabsTrigger>}
              <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-3">
              {projectsError ? (
                <Card><CardContent className="pt-6 text-center text-destructive">Failed to load projects.</CardContent></Card>
              ) : projectsLoading ? (
                <TabSkeleton />
              ) : !projects?.length ? (
                <EmptyState icon={FolderKanban} title="No projects found" description="Your projects will appear here once they're set up." />
              ) : (
                <div className="space-y-1.5">
                  {projects.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-caption text-muted-foreground">{p.start_date ?? 'No start date'} — {p.end_date ?? 'Ongoing'}</p>
                        </div>
                        <Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace('_', ' ')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workshops" className="mt-3">
              {deliveriesError ? (
                <Card><CardContent className="pt-6 text-center text-destructive">Failed to load workshops.</CardContent></Card>
              ) : deliveriesLoading ? (
                <TabSkeleton />
              ) : !deliveries?.length ? (
                <EmptyState icon={Briefcase} title="No workshops found" description="Your upcoming workshops will appear here." />
              ) : (
                <div className="space-y-1.5">
                  {deliveries.map((d) => (
                    <Card key={d.id}>
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{d.title}</p>
                          <p className="text-caption text-muted-foreground">{d.delivery_date ?? 'Date TBD'} · {d.location ?? 'Location TBD'}</p>
                        </div>
                        <Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status.replace('_', ' ')}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-3">
              {invoicesError ? (
                <Card><CardContent className="pt-6 text-center text-destructive">Failed to load invoices.</CardContent></Card>
              ) : invoicesLoading ? (
                <TabSkeleton rows={4} />
              ) : !invoices?.length ? (
                <EmptyState icon={FileText} title="No invoices found" description="Your invoices will appear here." />
              ) : (
                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
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

            {canSubmitForms && (
              <TabsContent value="feedback" className="mt-3">
                {!feedbackForms?.length ? (
                  <EmptyState icon={ClipboardList} title="No feedback forms available" description="Feedback forms will appear here after your workshops." />
                ) : (
                  <div className="space-y-1.5">
                    {feedbackForms.map((form) => (
                      <Card key={form.id}>
                        <CardContent className="pt-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{form.title}</p>
                            <p className="text-caption text-muted-foreground">
                              {(form as any).deliveries?.title ?? 'Workshop'} · {(form as any).deliveries?.delivery_date ?? ''}
                            </p>
                            {form.description && <p className="text-caption text-muted-foreground mt-1">{form.description}</p>}
                          </div>
                          <Button size="sm" asChild>
                            <Link to={`/form/${form.id}`}>Submit Feedback</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            <TabsContent value="analytics" className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">{projects?.length ?? 0}</p>
                    <p className="text-caption text-muted-foreground">Total Projects</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">{deliveries?.length ?? 0}</p>
                    <p className="text-caption text-muted-foreground">Total Workshops</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">{deliveries?.filter(d => d.status === 'delivered' || d.status === 'complete').length ?? 0}</p>
                    <p className="text-caption text-muted-foreground">Completed Workshops</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Projects by Status</CardTitle></CardHeader>
                  <CardContent>
                    {projects?.length ? (
                      <div className="space-y-2">
                        {Object.entries(
                          projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>)
                        ).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <Badge className="capitalize">{status.replace(/_/g, ' ')}</Badge>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Invoice Summary</CardTitle></CardHeader>
                  <CardContent>
                    {invoices?.length ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Invoiced</span>
                          <span className="text-sm font-medium">£{invoices.reduce((s, i) => s + Number(i.total), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Paid</span>
                          <span className="text-sm font-medium">£{invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Outstanding</span>
                          <span className="text-sm font-medium">£{invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No data</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
