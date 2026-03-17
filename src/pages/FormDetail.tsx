import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm as useFormData, useFormResponses, useUpdateForm } from '@/hooks/useForms';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function FormDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: form, isLoading } = useFormData(id);
  const { data: responses } = useFormResponses(id);
  const updateForm = useUpdateForm();

  if (isLoading) return <AppShell><Skeleton className="h-8 w-64" /></AppShell>;
  if (!form) return <AppShell><p className="text-text-2">Form not found.</p></AppShell>;

  const fields = (form.fields as any[]) ?? [];

  const toggleActive = async () => {
    await updateForm.mutateAsync({ id: form.id, active: !form.active });
    toast.success(form.active ? 'Form deactivated' : 'Form activated');
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center gap-md">
          <Link to="/forms" className="text-text-3 hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-page-title">{form.title}</h1>
          <Badge variant={form.active ? 'default' : 'outline'}>{form.active ? 'Active' : 'Inactive'}</Badge>
          <div className="ml-auto flex items-center gap-sm">
            <Button size="sm" variant="outline" onClick={toggleActive}>{form.active ? 'Deactivate' : 'Activate'}</Button>
            {form.active && (
              <a href={`/form/${form.id}`} target="_blank" rel="noopener">
                <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Public Link</Button>
              </a>
            )}
          </div>
        </div>

        <Tabs defaultValue="builder">
          <TabsList>
            <TabsTrigger value="builder">Fields ({fields.length})</TabsTrigger>
            <TabsTrigger value="responses">Responses ({responses?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-md">
            <div className="space-y-xs">
              {fields.map((f: any, i: number) => (
                <div key={f.id} className="bg-surface rounded-md border p-md flex items-center gap-md">
                  <span className="text-caption text-text-3 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-body">{f.label}</p>
                    <p className="text-caption text-text-3 capitalize">{f.type}{f.required ? ' · Required' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="responses" className="mt-md">
            {!responses?.length ? (
              <p className="text-text-2 text-center py-lg">No responses yet.</p>
            ) : (
              <div className="rounded-lg border bg-surface overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      {fields.map((f: any) => <TableHead key={f.id}>{f.label}</TableHead>)}
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell>{i + 1}</TableCell>
                        {fields.map((f: any) => <TableCell key={f.id}>{String((r.data as any)?.[f.id] ?? '—')}</TableCell>)}
                        <TableCell className="text-caption">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
