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

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Projects</h1>
          <div className="flex items-center gap-sm">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="table" className="text-xs px-2">Table</TabsTrigger>
                <TabsTrigger value="board" className="text-xs px-2">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-sm">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !projects?.length ? (
          <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
            <FolderKanban className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
            <p className="text-body text-text-2">No projects yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Project</Button>
          </div>
        ) : view === 'table' ? (
          <div className="rounded-lg border bg-surface overflow-hidden">
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
                  <TableRow key={p.id}>
                    <TableCell><Link to={`/projects/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link></TableCell>
                    <TableCell>{(p as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell><Badge className={getStatusBadgeClasses(p.status, 'project')}>{p.status.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>{p.budget ? `£${Number(p.budget).toLocaleString()}` : '—'}</TableCell>
                    <TableCell>{p.start_date ?? '—'}</TableCell>
                    <TableCell>{p.end_date ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex gap-md overflow-x-auto pb-md">
            {boardGroups.map((g) => (
              <div key={g.status} className="min-w-[240px] w-[240px] shrink-0">
                <div className="flex items-center gap-2 mb-sm">
                  <Badge variant="outline" className="capitalize text-xs">{g.status.replace(/_/g, ' ')}</Badge>
                  <span className="text-caption text-text-3">{g.items.length}</span>
                </div>
                <div className="space-y-xs">
                  {g.items.map((p) => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="block bg-surface rounded-md border p-sm hover:border-primary transition-colors">
                      <p className="text-body font-medium truncate">{p.name}</p>
                      <p className="text-caption text-text-3 truncate">{(p as any).organisations?.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
          <form onSubmit={handleManualSubmit} className="space-y-md">
            <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>Client *</Label>
              <Select value={orgId} onValueChange={setOrgId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{orgs?.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Budget (£)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            <div className="flex justify-end gap-sm">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createProject.isPending || !orgId}>Create</Button>
            </div>
          </form>
        )}

        {/* Plan Mode - Input */}
        {mode === 'plan' && !extracted && (
          <div className="space-y-md">
            <div>
              <Label>Paste your proposal, email, or plan</Label>
              <Textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                rows={8}
                placeholder="Paste the proposal text here and AI will extract project structure…"
              />
            </div>
            <div className="flex justify-end gap-sm">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleExtract} disabled={aiExtract.isPending || !planText.trim()}>
                {aiExtract.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Extracting…</> : <><Sparkles className="h-4 w-4 mr-1" /> Extract Plan</>}
              </Button>
            </div>
          </div>
        )}

        {/* Preview extracted plan */}
        {extracted && (
          <div className="space-y-md">
            <Button variant="ghost" size="sm" onClick={() => setExtracted(null)} className="gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{extracted.projectName}</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {extracted.organisationName && <p className="text-text-2">Client: {extracted.organisationName}</p>}
                {extracted.budget && <p className="text-text-2">Budget: £{extracted.budget.toLocaleString()}</p>}
                {extracted.startDate && <p className="text-text-2">Dates: {extracted.startDate} → {extracted.endDate}</p>}
                {extracted.intendedNeuroPhase && <p className="text-text-2">NEURO Phase: {extracted.intendedNeuroPhase}</p>}
                {extracted.notes && <p className="text-text-3 text-xs mt-2">{extracted.notes}</p>}
              </CardContent>
            </Card>

            {extracted.deliveries.length > 0 && (
              <div>
                <Label className="mb-2 block">Deliveries ({extracted.deliveries.length})</Label>
                <div className="space-y-xs">
                  {extracted.deliveries.map((d, i) => (
                    <div key={i} className="bg-muted rounded-md p-sm text-sm">
                      <p className="font-medium">{d.title}</p>
                      <p className="text-text-3 text-xs">
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

            <div className="flex justify-end gap-sm">
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
