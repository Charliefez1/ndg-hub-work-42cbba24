import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, useCreateProject, useScaffoldProject } from '@/hooks/useProjects';
import { useOrganisations } from '@/hooks/useOrganisations';
import { useServices } from '@/hooks/useServices';
import { useAIExtract } from '@/hooks/useAI';
import { Plus, FolderKanban, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusBadgeClasses } from '@/lib/status-colors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PROJECT_STATUSES = ['contracting', 'project_planning', 'session_planning', 'content_review', 'delivery', 'feedback_analytics', 'closed'];

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [view, setView] = useState<'table' | 'board'>('table');
  const [dialogOpen, setDialogOpen] = useState(false);

  const boardGroups = PROJECT_STATUSES.map((s) => ({
    status: s,
    items: projects?.filter((p) => p.status === s) ?? [],
  }));

  const PROJECT_COLUMN_COLORS: Record<string, { accent: string; dot: string }> = {
    contracting: { accent: 'border-t-warning', dot: 'bg-warning' },
    project_planning: { accent: 'border-t-[hsl(var(--info))]', dot: 'bg-[hsl(var(--info))]' },
    session_planning: { accent: 'border-t-[hsl(var(--cyan))]', dot: 'bg-[hsl(var(--cyan))]' },
    content_review: { accent: 'border-t-[hsl(var(--purple))]', dot: 'bg-[hsl(var(--purple))]' },
    delivery: { accent: 'border-t-success', dot: 'bg-success' },
    feedback_analytics: { accent: 'border-t-[hsl(var(--pink))]', dot: 'bg-[hsl(var(--pink))]' },
    closed: { accent: 'border-t-muted-foreground', dot: 'bg-muted-foreground' },
  };

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Projects</h1>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="table" className="text-xs px-2.5">Table</TabsTrigger>
                <TabsTrigger value="board" className="text-xs px-2.5">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Project</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : !projects?.length ? (
          <div className="bg-card rounded-xl border p-12 text-center space-y-3 shadow-sm">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" strokeWidth={1.25} />
            <p className="text-muted-foreground">No projects yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Project</Button>
          </div>
        ) : view === 'table' ? (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell><Link to={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{(p as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell><Badge className={`${getStatusBadgeClasses(p.status, 'project')} text-xs`}>{p.status.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>{p.budget ? `£${Number(p.budget).toLocaleString()}` : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.start_date ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.end_date ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {boardGroups.map((g) => {
              const colColors = PROJECT_COLUMN_COLORS[g.status] ?? { accent: 'border-t-muted-foreground', dot: 'bg-muted-foreground' };
              return (
                <div key={g.status} className="min-w-[260px] w-[260px] shrink-0">
                  <div className={`bg-card rounded-xl border border-t-[3px] ${colColors.accent} shadow-sm`}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${colColors.dot}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide capitalize">{g.status.replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">{g.items.length}</span>
                    </div>
                    <div className="px-2 pb-2 space-y-1.5">
                      {g.items.map((p) => (
                        <Link key={p.id} to={`/projects/${p.id}`} className="block bg-background rounded-xl border p-3 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{(p as any).organisations?.name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

// --- Create from Plan types ---
interface ExtractedDelivery {
  title: string;
  serviceType?: string;
  neuroPhase?: string;
  kirkpatrickLevel?: number;
  delegateCount?: number;
  durationMinutes?: number;
  deliveryDate?: string;
}

interface ExtractedPlan {
  projectName: string;
  organisationName?: string;
  intendedNeuroPhase?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  deliveries: ExtractedDelivery[];
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createProject = useCreateProject();
  const scaffoldProject = useScaffoldProject();
  const aiExtract = useAIExtract();
  const { data: orgs } = useOrganisations();
  const { data: services } = useServices();
  const [mode, setMode] = useState<'manual' | 'plan'>('manual');
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [budget, setBudget] = useState('');

  // Plan mode state
  const [planText, setPlanText] = useState('');
  const [extracted, setExtracted] = useState<ExtractedPlan | null>(null);
  const [previewOrgId, setPreviewOrgId] = useState('');

  const resetForm = () => {
    setName(''); setOrgId(''); setBudget('');
    setPlanText(''); setExtracted(null); setPreviewOrgId('');
    setMode('manual');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync({ name, organisation_id: orgId, budget: budget ? Number(budget) : null });
      toast.success('Project created');
      onOpenChange(false);
      resetForm();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleExtract = async () => {
    if (!planText.trim()) return;
    try {
      const data = await aiExtract.mutateAsync(planText);
      setExtracted(data as ExtractedPlan);
      // Try to auto-match org
      if (data.organisationName && orgs) {
        const match = orgs.find((o: any) => o.name.toLowerCase().includes(data.organisationName.toLowerCase()));
        if (match) setPreviewOrgId(match.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract plan');
    }
  };

  const handleScaffold = async () => {
    if (!extracted || !previewOrgId) return;
    try {
      // Map service types to service IDs
      const deliveries = extracted.deliveries.map((d) => {
        const svc = services?.find((s) => s.category === d.serviceType || s.name.toLowerCase().includes(d.serviceType?.replace(/_/g, ' ') ?? ''));
        return {
          title: d.title,
          service_id: svc?.id ?? null,
          neuro_phase: d.neuroPhase ?? null,
          kirkpatrick_level: d.kirkpatrickLevel ?? null,
          delegate_count: d.delegateCount ?? null,
          duration_minutes: d.durationMinutes ?? null,
          delivery_date: d.deliveryDate ?? null,
        };
      });

      await scaffoldProject.mutateAsync({
        organisationId: previewOrgId,
        name: extracted.projectName,
        deliveries,
        intendedNeuroPhase: extracted.intendedNeuroPhase ?? 'engage',
        budget: extracted.budget ?? 0,
        startDate: extracted.startDate ?? '',
        endDate: extracted.endDate ?? '',
        notes: extracted.notes,
      });

      toast.success('Project scaffolded with deliveries, sessions & forms');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>

        {/* Mode Switcher */}
        {!extracted && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
              <TabsTrigger value="plan" className="flex-1 gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Create from Plan
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && !extracted && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Client *</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Budget (£)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createProject.isPending || !orgId}>Create</Button>
            </div>
          </form>
        )}

        {/* Plan Mode - Input */}
        {mode === 'plan' && !extracted && (
          <div className="space-y-3">
            <div>
              <Label>Paste your proposal, email, or plan</Label>
              <Textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                rows={8}
                placeholder="Paste the proposal text here and AI will extract project structure…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleExtract} disabled={aiExtract.isPending || !planText.trim()}>
                {aiExtract.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Extracting…</> : <><Sparkles className="h-4 w-4 mr-1" /> Extract Plan</>}
              </Button>
            </div>
          </div>
        )}

        {/* Preview extracted plan */}
        {extracted && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setExtracted(null)} className="gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{extracted.projectName}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {extracted.organisationName && <p className="text-muted-foreground">Client: {extracted.organisationName}</p>}
                {extracted.budget && <p className="text-muted-foreground">Budget: £{extracted.budget.toLocaleString()}</p>}
                {extracted.startDate && <p className="text-muted-foreground">Dates: {extracted.startDate} → {extracted.endDate}</p>}
                {extracted.intendedNeuroPhase && <p className="text-muted-foreground">NEURO Phase: {extracted.intendedNeuroPhase}</p>}
                {extracted.notes && <p className="text-muted-foreground text-xs mt-2">{extracted.notes}</p>}
              </CardContent>
            </Card>

            {extracted.deliveries.length > 0 && (
              <div>
                <Label className="mb-2 block">Deliveries ({extracted.deliveries.length})</Label>
                <div className="space-y-1.5">
                  {extracted.deliveries.map((d, i) => (
                    <div key={i} className="bg-muted rounded-md p-3 text-sm">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {[d.serviceType?.replace(/_/g, ' '), d.neuroPhase, d.delegateCount && `${d.delegateCount} delegates`, d.deliveryDate].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Client *</Label>
              <Select value={previewOrgId} onValueChange={setPreviewOrgId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleScaffold} disabled={scaffoldProject.isPending || !previewOrgId}>
                {scaffoldProject.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Scaffolding…</> : 'Scaffold Project'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
