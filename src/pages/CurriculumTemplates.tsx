import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurriculumWorkshops, useCreateCurriculumWorkshop, useDeleteCurriculumWorkshop } from '@/hooks/useCurriculumWorkshops';
import { useServices } from '@/hooks/useServices';
import { BookTemplate, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function CurriculumTemplates() {
  const { data: templates, isLoading } = useCurriculumWorkshops();
  const { data: services } = useServices();
  const createTemplate = useCreateCurriculumWorkshop();
  const deleteTemplate = useDeleteCurriculumWorkshop();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [neuroPhase, setNeuroPhase] = useState('');

  const handleCreate = () => {
    createTemplate.mutate(
      {
        title,
        service_id: serviceId || null,
        neuro_phase: neuroPhase || null,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setTitle('');
          setServiceId('');
          setNeuroPhase('');
          toast.success('Template created');
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success('Template deleted'),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Curriculum Templates</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : !templates?.length ? (
          <div className="text-center py-xl">
            <BookTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
            <p className="text-muted-foreground">No curriculum templates yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <Card key={t.id} className="group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="truncate">{t.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {(t as any).services?.name && (
                    <p className="text-caption text-muted-foreground">Service: {(t as any).services.name}</p>
                  )}
                  {t.neuro_phase && (
                    <Badge variant="outline" className="text-xs">{t.neuro_phase}</Badge>
                  )}
                  {Array.isArray(t.default_agenda) && (
                    <p className="text-caption text-muted-foreground">{(t.default_agenda as any[]).length} agenda items</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Curriculum Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Resilience Programme" />
              </div>
              <div>
                <Label>Service</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Neuro Phase</Label>
                <Select value={neuroPhase} onValueChange={setNeuroPhase}>
                  <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
                  <SelectContent>
                    {['Engage', 'Activate', 'Embed', 'Sustain'].map((p) => (
                      <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!title.trim()}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
