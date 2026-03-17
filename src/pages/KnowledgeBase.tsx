import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useKnowledgeArticles, useCreateKnowledgeArticle } from '@/hooks/useKnowledgeArticles';
import { Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function KnowledgeBase() {
  const { data: articles, isLoading } = useKnowledgeArticles();
  const createArticle = useCreateKnowledgeArticle();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createArticle.mutateAsync({
        title: fd.get('title') as string,
        category: (fd.get('category') as string) || null,
        content: (fd.get('content') as string) || null,
        tags: (fd.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || null,
      });
      toast.success('Article created');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Knowledge Base</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Article</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Article</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-md">
                <div><Label>Title</Label><Input name="title" required className="mt-1" /></div>
                <div><Label>Category</Label><Input name="category" className="mt-1" /></div>
                <div><Label>Tags (comma-separated)</Label><Input name="tags" placeholder="e.g. neuro, facilitation" className="mt-1" /></div>
                <div><Label>Content</Label><Textarea name="content" rows={6} className="mt-1" /></div>
                <Button type="submit" disabled={createArticle.isPending} className="w-full">Create Article</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-text-2 text-center py-lg">Loading…</p>
        ) : !articles?.length ? (
          <p className="text-text-2 text-center py-lg">No articles yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {articles.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-body flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-text-3" />
                      {a.title}
                    </CardTitle>
                    {a.category && <Badge variant="secondary">{a.category}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {a.content && (
                    <p className="text-caption text-text-2 line-clamp-3">{a.content}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {a.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                  <p className="text-caption text-text-3 mt-2">
                    {a.updated_at ? formatDistanceToNow(new Date(a.updated_at), { addSuffix: true }) : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
