import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner, type Partner } from '@/hooks/usePartners';
import { Plus, Users, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const PARTNER_TYPES = ['referral', 'delivery', 'technology', 'content', 'other'] as const;

const TYPE_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  referral:   { border: 'border-l-vivid-cyan',    bg: 'bg-vivid-cyan/10',    text: 'text-vivid-cyan',    dot: 'bg-vivid-cyan' },
  delivery:   { border: 'border-l-vivid-purple',  bg: 'bg-vivid-purple/10',  text: 'text-vivid-purple',  dot: 'bg-vivid-purple' },
  technology: { border: 'border-l-vivid-indigo',  bg: 'bg-vivid-indigo/10',  text: 'text-vivid-indigo',  dot: 'bg-vivid-indigo' },
  content:    { border: 'border-l-vivid-pink',    bg: 'bg-vivid-pink/10',    text: 'text-vivid-pink',    dot: 'bg-vivid-pink' },
  other:      { border: 'border-l-muted-foreground', bg: 'bg-muted/50', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

function getTypeColor(type: string | null) {
  return TYPE_COLORS[type ?? 'other'] ?? TYPE_COLORS.other;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Partners() {
  const { data: partners, isLoading } = usePartners();
  const deletePartner = useDeletePartner();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.contact_email?.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === 'all' || (p.type ?? 'other') === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [partners, search, typeFilter]);

  const typeCounts = useMemo(() => {
    if (!partners) return {};
    const counts: Record<string, number> = {};
    partners.forEach(p => {
      const t = p.type ?? 'other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [partners]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    try { await deletePartner.mutateAsync(id); toast.success('Partner deleted'); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">Partners</h1>
            {partners && partners.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                {PARTNER_TYPES.map(t => {
                  const count = typeCounts[t];
                  if (!count) return null;
                  const c = getTypeColor(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${typeFilter !== 'all' && typeFilter !== t ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      <span className="text-muted-foreground capitalize">{t}</span>
                      <span className="font-mono text-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Button size="sm" onClick={() => { setEditingPartner(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Partner
          </Button>
        </div>

        {/* Search & Filter */}
        {partners && partners.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search partners…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {PARTNER_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-[100px] animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : !partners?.length ? (
          <EmptyState
            icon={Users}
            title="No partners yet"
            description="Add your first referral, delivery, or technology partner."
            action={
              <Button size="sm" onClick={() => { setEditingPartner(null); setDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Partner
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No partners match your search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger-in">
            {filtered.map((p) => {
              const c = getTypeColor(p.type);
              return (
                <Card key={p.id} className={`border-l-[3px] ${c.border} group`}>
                  <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className={`${c.bg} ${c.text} text-xs font-semibold`}>
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {p.contact_email ?? '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0">
                            {p.type ?? 'other'}
                          </Badge>
                          {p.commission_rate != null && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {p.commission_rate}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingPartner(p); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <PartnerDialog
        key={editingPartner?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
      />
    </AppShell>
  );
}

function PartnerDialog({ open, onOpenChange, partner }: { open: boolean; onOpenChange: (o: boolean) => void; partner: Partner | null }) {
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const isEdit = !!partner;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name') as string,
      type: (fd.get('type') as string) || null,
      contact_email: (fd.get('contact_email') as string) || null,
      commission_rate: Number(fd.get('commission_rate')) || null,
    };
    try {
      if (isEdit) {
        await updatePartner.mutateAsync({ id: partner.id, ...payload });
        toast.success('Partner updated');
      } else {
        await createPartner.mutateAsync(payload);
        toast.success('Partner created');
      }
      onOpenChange(false);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Partner' : 'New Partner'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input name="name" required defaultValue={partner?.name ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="type" defaultValue={partner?.type ?? 'referral'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input name="contact_email" type="email" defaultValue={partner?.contact_email ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label>Commission Rate (%)</Label>
            <Input name="commission_rate" type="number" step="0.01" defaultValue={partner?.commission_rate?.toString() ?? ''} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createPartner.isPending || updatePartner.isPending}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
