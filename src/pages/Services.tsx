import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useServices, useDeleteService, useUpdateService, type Service } from '@/hooks/useServices';
import { ServiceDialog } from '@/components/services/ServiceDialog';
import { Plus, MoreHorizontal, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Services() {
  const { data: services, isLoading } = useServices();
  const deleteService = useDeleteService();
  const updateService = useUpdateService();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const openCreate = () => { setEditingService(null); setDialogOpen(true); };
  const openEdit = (s: Service) => { setEditingService(s); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast.success('Service deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (s: Service) => {
    try {
      await updateService.mutateAsync({ id: s.id, active: !s.active });
      toast.success(s.active ? 'Service deactivated' : 'Service activated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Services</h1>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Service
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-sm">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !services?.length ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <div className="rounded-lg border bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{s.category}</Badge></TableCell>
                    <TableCell>£{Number(s.price).toLocaleString()}</TableCell>
                    <TableCell>{s.default_duration_minutes ? `${s.default_duration_minutes}m` : '—'}</TableCell>
                    <TableCell>{s.default_neuro_phase ?? '—'}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleActive(s)} className="cursor-pointer">
                        <Badge variant={s.active ? 'default' : 'outline'}>
                          {s.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
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

      <ServiceDialog
        key={editingService?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
      />
    </AppShell>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-surface rounded-lg border p-xl text-center space-y-md">
      <Package className="h-12 w-12 mx-auto text-text-3" strokeWidth={1.25} />
      <div>
        <p className="text-body font-medium text-foreground">No services yet</p>
        <p className="text-caption text-text-2 mt-1">Create your first service to get started.</p>
      </div>
      <Button onClick={onCreate} size="sm">
        <Plus className="h-4 w-4 mr-1" /> New Service
      </Button>
    </div>
  );
}
