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
import { Progress } from '@/components/ui/progress';
import { ProjectTimeline } from '@/components/portal/ProjectTimeline';
import { FolderKanban, Briefcase, FileText, ClipboardList, BarChart3, FileDown, MapPin, Users, Calendar, FileIcon } from 'lucide-react';

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

  const projectIds = projects?.map(p => p.id) ?? [];

  // Documents for client
  const canViewDocuments = access?.some((a) => (a.permissions as any)?.can_view_documents === true);

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['portal-documents', projectIds],
    enabled: canViewDocuments && projectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', 'project')
        .in('entity_id', projectIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Sessions for workshop prep
  const deliveryIds = deliveries?.map(d => d.id) ?? [];
  const { data: sessions } = useQuery({
    queryKey: ['portal-sessions', deliveryIds],
    enabled: deliveryIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, delivery_id, duration_minutes, session_type, sort_order')
        .in('delivery_id', deliveryIds)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: feedbackForms } = useQuery({
    queryKey: ['portal-feedback-forms', orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const dIds = deliveries?.map((d) => d.id) ?? [];
      if (!dIds.length) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*, deliveries(title, delivery_date)')
        .eq('type', 'feedback')
        .eq('active', true)
        .in('delivery_id', dIds);
      if (error) throw error;
      return data;
    },
  });

  const canSubmitForms = access?.some((a) => (a.permissions as any)?.can_submit_forms !== false);

  // Satisfaction score
  const completedDeliveries = deliveries?.filter(d => d.status === 'delivered' || d.status === 'complete') ?? [];
  const avgSatisfaction = completedDeliveries.length > 0
    ? completedDeliveries.filter(d => d.satisfaction_score != null).reduce((s, d) => s + Number(d.satisfaction_score), 0)
      / (completedDeliveries.filter(d => d.satisfaction_score != null).length || 1)
    : null;

  // Prep-ready workshops
  const prepWorkshops = deliveries?.filter(d =>
    ['confirmed', 'scheduled', 'planning'].includes(d.status) && d.delivery_date
  ) ?? [];

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
            <TabsList className="flex-wrap">
              <TabsTrigger value="projects">Projects ({projects?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="workshops">Workshops ({deliveries?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length ?? 0})</TabsTrigger>
              {canViewDocuments && <TabsTrigger value="documents">Documents</TabsTrigger>}
              {canSubmitForms && <TabsTrigger value="feedback">Feedback</TabsTrigger>}
              <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics</TabsTrigger>
            </TabsList>

            {/* Projects with Timeline */}
            <TabsContent value="projects" className="mt-3">
              {projectsError ? (
                <Card><CardContent className="pt-6 text-center text-destructive">Failed to load projects.</CardContent></Card>
              ) : projectsLoading ? (
                <TabSkeleton />
              ) : !projects?.length ? (
                <EmptyState icon={FolderKanban} title="No projects found" description="Your projects will appear here once they're set up." />
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-caption text-muted-foreground">{p.start_date ?? 'No start date'} — {p.end_date ?? 'Ongoing'}</p>
                          </div>
                          <Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <ProjectTimeline status={p.status} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Workshops with Prep Cards */}
            <TabsContent value="workshops" className="mt-3">
              {deliveriesError ? (
                <Card><CardContent className="pt-6 text-center text-destructive">Failed to load workshops.</CardContent></Card>
              ) : deliveriesLoading ? (
                <TabSkeleton />
              ) : !deliveries?.length ? (
                <EmptyState icon={Briefcase} title="No workshops found" description="Your upcoming workshops will appear here." />
              ) : (
                <div className="space-y-2">
                  {deliveries.map((d) => {
                    const isPrepReady = ['confirmed', 'scheduled'].includes(d.status);
                    const deliverySessions = sessions?.filter(s => s.delivery_id === d.id) ?? [];

                    return (
                      <Card key={d.id} className={isPrepReady ? 'border-primary/20' : ''}>
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{d.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-caption text-muted-foreground">
                                {d.delivery_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{d.delivery_date}</span>}
                                {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.location}</span>}
                                {d.delegate_count && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{d.delegate_count} delegates</span>}
                              </div>
                            </div>
                            <Badge className={getStatusBadgeClasses(d.status, 'delivery')}>{d.status.replace(/_/g, ' ')}</Badge>
                          </div>

                          {isPrepReady && deliverySessions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">Session Agenda</p>
                              <div className="space-y-1">
                                {deliverySessions.map((s) => (
                                  <div key={s.id} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2.5 py-1.5">
                                    <span>{s.title}</span>
                                    {s.duration_minutes && <span className="text-xs text-muted-foreground">{s.duration_minutes}min</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Invoices with Download */}
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

            {/* Documents Tab */}
            {canViewDocuments && (
              <TabsContent value="documents" className="mt-3">
                {documentsLoading ? (
                  <TabSkeleton rows={3} />
                ) : !documents?.length ? (
                  <EmptyState icon={FileIcon} title="No documents available" description="Project documents will appear here when shared by your team." />
                ) : (
                  <div className="space-y-1.5">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <FileIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-caption text-muted-foreground">
                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB') : ''}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                              <FileDown className="h-3.5 w-3.5" /> Download
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

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

            {/* Analytics with Satisfaction */}
            <TabsContent value="analytics" className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    <p className="text-2xl font-bold">{completedDeliveries.length}</p>
                    <p className="text-caption text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card className={avgSatisfaction != null ? 'border-primary/20' : ''}>
                  <CardContent className="pt-4 text-center">
                    {avgSatisfaction != null ? (
                      <>
                        <p className="text-2xl font-bold text-primary">{avgSatisfaction.toFixed(1)}<span className="text-sm text-muted-foreground">/5</span></p>
                        <Progress value={(avgSatisfaction / 5) * 100} className="h-1.5 mt-2" />
                        <p className="text-caption text-muted-foreground mt-1">Avg Satisfaction</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-muted-foreground">—</p>
                        <p className="text-caption text-muted-foreground">Avg Satisfaction</p>
                      </>
                    )}
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
                            <Badge className={getStatusBadgeClasses(status, 'project')}>{status.replace(/_/g, ' ')}</Badge>
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
