import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useEmails } from '@/hooks/useEmails';
import { Mail, Search } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Emails() {
  const { data: emails, isLoading } = useEmails();
  const [search, setSearch] = useState('');

  const filtered = emails?.filter((e) =>
    [e.subject, e.from_address, e.snippet, (e as any).organisations?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-page-title">Emails</h1>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-xl">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
            <p className="text-muted-foreground">No email threads found.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{email.subject ?? '(no subject)'}</p>
                        <p className="text-caption text-muted-foreground truncate max-w-md">{email.snippet}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-caption">{email.from_address ?? '—'}</TableCell>
                    <TableCell className="text-caption">{(email as any).organisations?.name ?? '—'}</TableCell>
                    <TableCell className="text-caption whitespace-nowrap">
                      {email.received_at
                        ? new Date(email.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
