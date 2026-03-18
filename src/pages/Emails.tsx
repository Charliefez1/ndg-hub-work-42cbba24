import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useEmails } from '@/hooks/useEmails';
import { useGmailStatus, useGmailAuthUrl, useGmailSync, useGmailDisconnect } from '@/hooks/useGmailSync';
import { Mail, Search, RefreshCw, ExternalLink, Loader2, Unlink } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Emails() {
  const { data: emails, isLoading } = useEmails();
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();

  const { data: gmailStatus, isLoading: statusLoading } = useGmailStatus();
  const gmailAuthUrl   = useGmailAuthUrl();
  const gmailSync      = useGmailSync();
  const gmailDisconnect = useGmailDisconnect();

  // Handle OAuth callback redirect
  useEffect(() => {
    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'connected') {
      toast.success('Gmail connected successfully! Click "Sync" to import emails.');
    } else if (gmailParam === 'error') {
      const msg = searchParams.get('msg') ?? 'Connection failed';
      toast.error(`Gmail connection failed: ${msg}`);
    }
  }, [searchParams]);

  const handleSync = async () => {
    try {
      const result = await gmailSync.mutateAsync();
      toast.success(result?.message ?? `Synced ${result?.synced ?? 0} emails`);
    } catch (e: any) {
      toast.error(e.message ?? 'Sync failed');
    }
  };

  const filtered = emails?.filter((e) =>
    [e.subject, e.from_address, e.snippet, (e as any).organisations?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-lg">
        <div className="flex items-center justify-between gap-sm flex-wrap">
          <h1 className="text-page-title">Emails</h1>

          <div className="flex items-center gap-sm">
            {!statusLoading && (
              gmailStatus?.connected ? (
                <>
                  <span className="text-caption text-text-3 hidden sm:block">
                    {gmailStatus.email}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSync}
                    disabled={gmailSync.isPending}
                  >
                    {gmailSync.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Sync Gmail
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => gmailDisconnect.mutate()}
                    disabled={gmailDisconnect.isPending}
                    title="Disconnect Gmail"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => gmailAuthUrl.mutate()}
                  disabled={gmailAuthUrl.isPending}
                >
                  {gmailAuthUrl.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    : <ExternalLink className="h-3.5 w-3.5 mr-1.5" />}
                  Connect Gmail
                </Button>
              )
            )}
          </div>
        </div>

        {!gmailStatus?.connected && !statusLoading && (
          <Card>
            <CardContent className="py-md flex items-start gap-md">
              <Mail className="h-5 w-5 text-text-3 mt-0.5 shrink-0" />
              <div>
                <p className="text-body font-medium">Connect your Gmail account</p>
                <p className="text-caption text-text-3 mt-0.5">
                  Link your Gmail to sync email threads from clients into NDG Hub. Emails are read-only and linked to organisations and projects.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
          <Input
            placeholder="Search emails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-xs">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-xl">
            <Mail className="h-12 w-12 mx-auto text-text-3 mb-md" strokeWidth={1.25} />
            <p className="text-text-2">
              {gmailStatus?.connected
                ? 'No email threads found. Try syncing above.'
                : 'Connect Gmail to see your email threads here.'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-surface overflow-hidden">
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
                        <p className="text-caption text-text-3 truncate max-w-md">{email.snippet}</p>
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
