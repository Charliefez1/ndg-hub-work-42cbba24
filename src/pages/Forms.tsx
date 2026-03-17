import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForms, useCreateForm, useDeleteForm } from '@/hooks/useForms';
import { useProjects } from '@/hooks/useProjects';
import { Plus, ClipboardList, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const FORM_TYPES = ['feedback', 'assessment', 'survey', 'registration'];

export default function Forms() {
  const { data: forms, isLoading } = useForms();
  const deleteForm = useDeleteForm();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Forms</h1>
          <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Form</Button>
        </div>

        {isLoading ? (
          <div className="space-y-sm">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !forms?.length ? (
          <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
            <ClipboardList className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
            <p className="text-body text-text-2">No forms yet.</p>
            <Button onClick={() => setDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> New Form</Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Public Link</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell><Link to={`/forms/${f.id}`} className="font-medium text-primary hover:underline">{f.title}</Link></TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{f.type}</Badge></TableCell>
                    <TableCell>{(f as any).projects?.name ?? '—'}</TableCell>
                    <TableCell><Badge variant={f.active ? 'default' : 'outline'}>{f.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      {f.active && (
                        <a href={`/form/${f.id}`} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1 text-caption">
                          <ExternalLink className="h-3 w-3" /> Open
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={async () => { await deleteForm.mutateAsync(f.id); toast.success('Form deleted'); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </AppShell>
  );
}

function CreateFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createForm = useCreateForm();
  const { data: projects } = useProjects();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('feedback');
  const [projectId, setProjectId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createForm.mutateAsync({
        title, type, project_id: projectId || null,
        fields: [
          { id: '1', label: 'Overall satisfaction', type: 'rating', required: true },
          { id: '2', label: 'What did you find most valuable?', type: 'textarea', required: false },
          { id: '3', label: 'Any suggestions for improvement?', type: 'textarea', required: false },
        ],
      });
      toast.success('Form created');
      onOpenChange(false);
      setTitle(''); setType('feedback'); setProjectId('');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Form</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div><Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORM_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-sm">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createForm.isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
