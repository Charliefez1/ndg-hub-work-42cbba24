import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useKnowledgeArticles, useCreateKnowledgeArticle, useUpdateKnowledgeArticle, useDeleteKnowledgeArticle } from '@/hooks/useKnowledgeArticles';
import { Plus, BookOpen, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { KnowledgeArticle } from '@/hooks/useKnowledgeArticles';

export default function KnowledgeBase() {
  const { data: articles, isLoading } = useKnowledgeArticles();
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null);
  const [search, setSearch] = useState('');

  const filtered = articles?.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase()) ||
    a.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get('title') as string,
      category: (fd.get('category') as string) || null,
      content: (fd.get('content') as string) || null,
      tags: (fd.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || null,
    };
    try {
      if (editing) {
        await updateArticle.mutateAsync({ id: editing.id, ...payload });
        toast.success('Article updated');
      } else {
        await createArticle.mutateAsync(payload);
        toast.success('Article created');
      }
      setOpen(false);
      setEditing(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleTogglePublish = async (article: KnowledgeArticle) => {
    await updateArticle.mutateAsync({ id: article.id, is_published: !article.is_published });
    toast.success(article.is_published ? 'Unpublished' : 'Published');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await deleteArticle.mutateAsync(id);
    toast.success('Article deleted');
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Knowledge Base</h1>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Article
          </Button>
        </div>

        <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        {isLoading ? (
          <p className="text-muted-foreground text-center py-4">Loading…</p>
        ) : !filtered?.length ? (
          <p className="text-muted-foreground text-center py-4">No articles found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {a.title}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {a.is_published ? (
                        <Badge variant="default" className="text-[10px]"><Eye className="h-3 w-3 mr-0.5" />Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]"><EyeOff className="h-3 w-3 mr-0.5" />Draft</Badge>
                      )}
                      {a.category && <Badge variant="secondary">{a.category}</Badge>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(a)}>
                            {a.is_published ? <><EyeOff className="h-3.5 w-3.5 mr-2" />Unpublish</> : <><Eye className="h-3.5 w-3.5 mr-2" />Publish</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(a.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {a.content && <p className="text-caption text-muted-foreground line-clamp-3">{a.content}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    {a.tags?.map((tag) => <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>)}
                  </div>
                  <p className="text-caption text-muted-foreground mt-2">
                    {a.updated_at ? formatDistanceToNow(new Date(a.updated_at), { addSuffix: true }) : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Article' : 'New Article'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Title</Label><Input name="title" required defaultValue={editing?.title ?? ''} className="mt-1" /></div>
            <div><Label>Category</Label><Input name="category" defaultValue={editing?.category ?? ''} className="mt-1" /></div>
            <div><Label>Tags (comma-separated)</Label><Input name="tags" defaultValue={editing?.tags?.join(', ') ?? ''} placeholder="e.g. neuro, facilitation" className="mt-1" /></div>
            <div><Label>Content</Label><Textarea name="content" rows={6} defaultValue={editing?.content ?? ''} className="mt-1" /></div>
            <Button type="submit" disabled={createArticle.isPending || updateArticle.isPending} className="w-full">
              {editing ? 'Save Changes' : 'Create Article'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
