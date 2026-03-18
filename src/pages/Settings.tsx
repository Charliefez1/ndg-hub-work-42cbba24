import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStoredTheme, getStoredAccent, setTheme, setAccent, type Theme, type Accent } from '@/lib/theme';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
} from '@/hooks/useNotificationPreferences';
import { useGmailStatus, useGmailAuthUrl, useGmailDisconnect } from '@/hooks/useGmailSync';
import { useGcalStatus, useGcalAuthUrl, useGcalDisconnect } from '@/hooks/useGcalSync';
import { Sun, Moon, Monitor, Check, Mail, Calendar, Send, Loader2, ExternalLink } from 'lucide-react';
import { toast as sonner } from 'sonner';

const ACCENT_OPTIONS: { value: Accent; label: string; color: string }[] = [
  { value: 'steel',  label: 'Steel',  color: '#4A7CBA' },
  { value: 'sky',    label: 'Sky',    color: '#0EA5E9' },
  { value: 'mint',   label: 'Mint',   color: '#10B981' },
  { value: 'amber',  label: 'Amber',  color: '#F59E0B' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light',  label: 'Light',  icon: <Sun className="h-4 w-4" /> },
  { value: 'dark',   label: 'Dark',   icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const NOTIF_TYPES = [
  { key: 'task_assigned'     as const, label: 'Task assigned to me',            desc: 'When a task is assigned to you' },
  { key: 'delivery_reminder' as const, label: 'Workshop delivery reminders',    desc: 'Day-before reminder for scheduled workshops' },
  { key: 'invoice_overdue'   as const, label: 'Invoice overdue alerts',         desc: 'When an invoice passes its due date' },
  { key: 'form_response'     as const, label: 'New feedback form responses',     desc: 'When someone submits a linked form' },
  { key: 'project_status'    as const, label: 'Project status changes',          desc: 'When a project advances through its pipeline' },
];

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  // Profile state
  const [displayName, setDisplayName]       = useState(profile?.display_name ?? '');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving]                 = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Appearance state
  const [currentTheme,  setCurrentTheme]  = useState<Theme>(getStoredTheme());
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());

  // Notification preferences
  const { data: prefs, isLoading: prefsLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  // Integrations
  const { data: gmailStatus } = useGmailStatus();
  const gmailAuthUrl   = useGmailAuthUrl();
  const gmailDisconnect = useGmailDisconnect();
  const { data: gcalStatus } = useGcalStatus();
  const gcalAuthUrl    = useGcalAuthUrl();
  const gcalDisconnect  = useGcalDisconnect();

  // Load profile data
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('telegram_chat_id').eq('id', user.id).single()
      .then(({ data }) => { if (data?.telegram_chat_id) setTelegramChatId(data.telegram_chat_id); });
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      telegram_chat_id: telegramChatId || null,
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId) {
      toast({ title: 'No Chat ID', description: 'Save your Telegram Chat ID first.', variant: 'destructive' });
      return;
    }
    setTestingTelegram(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('telegram-notify', {
      body: { action: 'test' },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setTestingTelegram(false);
    if (res.error || res.data?.error) {
      toast({ title: 'Telegram test failed', description: res.data?.error ?? res.error?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Telegram test sent!', description: 'Check your Telegram app.' });
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setTheme(theme);
  };

  const handleAccentChange = (accent: Accent) => {
    setCurrentAccent(accent);
    setAccent(accent);
  };

  const handlePrefToggle = useCallback(
    (type: keyof NotificationPreferences, channel: 'in_app' | 'telegram', value: boolean) => {
      if (!prefs) return;
      const next: NotificationPreferences = {
        ...prefs,
        [type]: { ...prefs[type], [channel]: value },
      };
      updatePrefs.mutate(next, {
        onSuccess: () => sonner.success('Preferences saved'),
        onError: (e: any) => sonner.error(e.message),
      });
    },
    [prefs, updatePrefs],
  );

  return (
    <AppShell>
      <div className="space-y-lg">
        <h1 className="text-page-title">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* ── Profile ─────────────────────────────────── */}
          <TabsContent value="profile" className="mt-md space-y-md">
            <Card>
              <CardHeader><CardTitle className="text-body">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-md">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email ?? ''} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={profile?.role ?? ''} disabled className="mt-1" />
                </div>
                <Separator />
                <div>
                  <Label>Telegram Chat ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestTelegram}
                      disabled={testingTelegram || !telegramChatId}
                    >
                      {testingTelegram ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span className="ml-1.5">Test</span>
                    </Button>
                  </div>
                  <p className="text-caption text-text-3 mt-1">
                    Start a chat with your bot on Telegram, then send <code>/start</code> to get your Chat ID.
                    Used for push notifications when Telegram is enabled per notification type.
                  </p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Appearance ─────────────────────────────── */}
          <TabsContent value="appearance" className="mt-md space-y-md">
            <Card>
              <CardHeader><CardTitle className="text-body">Theme</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-sm">
                  {THEME_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={currentTheme === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange(opt.value)}
                      className="flex items-center gap-2"
                    >
                      {opt.icon}
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-body">Accent Colour</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-md">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAccentChange(opt.value)}
                      className="relative w-10 h-10 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: opt.color,
                        borderColor: currentAccent === opt.value ? opt.color : 'transparent',
                        boxShadow: currentAccent === opt.value ? `0 0 0 3px ${opt.color}40` : 'none',
                      }}
                      title={opt.label}
                    >
                      {currentAccent === opt.value && (
                        <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications ───────────────────────────── */}
          <TabsContent value="notifications" className="mt-md">
            <Card>
              <CardHeader>
                <CardTitle className="text-body">Notification Preferences</CardTitle>
                <CardDescription>Choose how you receive each notification type.</CardDescription>
              </CardHeader>
              <CardContent>
                {prefsLoading ? (
                  <p className="text-caption text-text-3 py-md">Loading preferences…</p>
                ) : (
                  <div className="space-y-0">
                    {/* Column headers */}
                    <div className="flex items-center pb-sm border-b mb-sm">
                      <div className="flex-1" />
                      <div className="flex gap-xl mr-2">
                        <span className="text-caption text-text-3 w-12 text-center">In-app</span>
                        <span className="text-caption text-text-3 w-16 text-center">Telegram</span>
                      </div>
                    </div>

                    {NOTIF_TYPES.map((item) => {
                      const typePref = prefs?.[item.key] ?? { in_app: true, telegram: false };
                      return (
                        <div key={item.key} className="flex items-center justify-between py-sm border-b last:border-0">
                          <div>
                            <p className="text-body font-medium">{item.label}</p>
                            <p className="text-caption text-text-3">{item.desc}</p>
                          </div>
                          <div className="flex gap-xl items-center mr-2">
                            <div className="w-12 flex justify-center">
                              <Switch
                                checked={typePref.in_app}
                                onCheckedChange={(v) => handlePrefToggle(item.key, 'in_app', v)}
                                disabled={updatePrefs.isPending}
                              />
                            </div>
                            <div className="w-16 flex justify-center">
                              <Switch
                                checked={typePref.telegram}
                                onCheckedChange={(v) => handlePrefToggle(item.key, 'telegram', v)}
                                disabled={updatePrefs.isPending}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <p className="text-caption text-text-3 pt-sm">
                      Telegram notifications require a Chat ID in Profile settings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Integrations ────────────────────────────── */}
          <TabsContent value="integrations" className="mt-md space-y-md">
            {/* Gmail */}
            <Card>
              <CardHeader>
                <CardTitle className="text-body flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Gmail
                </CardTitle>
                <CardDescription>
                  Sync emails from your Gmail inbox. Messages are stored read-only in NDG Hub.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {gmailStatus?.connected ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-success/15 text-success border-success/20">Connected</Badge>
                          <span className="text-caption text-text-2">{gmailStatus.email}</span>
                        </div>
                        {gmailStatus.lastSync && (
                          <p className="text-caption text-text-3">
                            Last synced: {new Date(gmailStatus.lastSync).toLocaleString('en-GB')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-caption text-text-3">Not connected</p>
                    )}
                  </div>
                  <div className="flex gap-sm">
                    {gmailStatus?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => gmailDisconnect.mutate()}
                        disabled={gmailDisconnect.isPending}
                      >
                        {gmailDisconnect.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => gmailAuthUrl.mutate()}
                        disabled={gmailAuthUrl.isPending}
                      >
                        {gmailAuthUrl.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Connect Gmail
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-caption text-text-3 mt-sm">
                  Requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> environment variables.
                </p>
              </CardContent>
            </Card>

            {/* Google Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-body flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Google Calendar
                </CardTitle>
                <CardDescription>
                  Sync meetings to Google Calendar. Creates and updates calendar events automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {gcalStatus?.connected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-success/15 text-success border-success/20">Connected</Badge>
                        <span className="text-caption text-text-2">{gcalStatus.email}</span>
                      </div>
                    ) : (
                      <p className="text-caption text-text-3">Not connected</p>
                    )}
                  </div>
                  <div className="flex gap-sm">
                    {gcalStatus?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => gcalDisconnect.mutate()}
                        disabled={gcalDisconnect.isPending}
                      >
                        {gcalDisconnect.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => gcalAuthUrl.mutate()}
                        disabled={gcalAuthUrl.isPending}
                      >
                        {gcalAuthUrl.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Connect Calendar
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-caption text-text-3 mt-sm">
                  Requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> environment variables.
                </p>
              </CardContent>
            </Card>

            {/* Email sending */}
            <Card>
              <CardHeader>
                <CardTitle className="text-body flex items-center gap-2">
                  <Send className="h-4 w-4" /> Invoice Email (Resend)
                </CardTitle>
                <CardDescription>
                  Sends invoice emails to clients when you click "Send" on an invoice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-caption text-text-3">
                  Configure by setting <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> environment variables in your Supabase project.
                  When configured, invoices are emailed to the primary contact of the organisation.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
