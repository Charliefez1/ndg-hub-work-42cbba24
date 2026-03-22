import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getStoredTheme, getStoredAccent, setTheme, setAccent, type Theme, type Accent } from '@/lib/theme';
import { Sun, Moon, Monitor, Check, Calendar, Mail, HardDrive, Receipt, Brain, MessageCircle, ExternalLink, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ACCENT_OPTIONS: { value: Accent; label: string; color: string }[] = [
  { value: 'steel', label: 'Steel', color: '#3B82F6' },
  { value: 'sky', label: 'Sky', color: '#0EA5E9' },
  { value: 'mint', label: 'Mint', color: '#14B8A6' },
  { value: 'amber', label: 'Amber', color: '#F59E0B' },
  { value: 'purple', label: 'Purple', color: '#7C3AED' },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const INTEGRATIONS = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync meetings bidirectionally with Google Calendar',
    icon: Calendar,
    status: 'not_connected' as const,
    color: 'text-vivid-blue',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and receive client emails directly from NQI Hub',
    icon: Mail,
    status: 'not_connected' as const,
    color: 'text-vivid-red',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and link project documents in Google Drive',
    icon: HardDrive,
    status: 'not_connected' as const,
    color: 'text-vivid-yellow',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices and payments with QuickBooks Online',
    icon: Receipt,
    status: 'not_connected' as const,
    color: 'text-vivid-green',
  },
  {
    id: 'clarify-crm',
    name: 'Clarify AI CRM',
    description: 'Import leads and deal data from Clarify',
    icon: Brain,
    status: 'not_connected' as const,
    color: 'text-vivid-purple',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Push notifications and bot commands via Telegram',
    icon: MessageCircle,
    status: 'not_connected' as const,
    color: 'text-vivid-cyan',
  },
];

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme());
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saving, setSaving] = useState(false);

  // Automation log
  const { data: automationLog } = useQuery({
    queryKey: ['automation-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('telegram_chat_id').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.telegram_chat_id) setTelegramChatId(data.telegram_chat_id);
        });
    }
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

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setTheme(theme);
  };

  const handleAccentChange = (accent: Accent) => {
    setCurrentAccent(accent);
    setAccent(accent);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <h1 className="text-page-title">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="automations"><Zap className="h-3.5 w-3.5 mr-1" />Automations</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-3 space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={profile?.role || ''} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Telegram Chat ID</Label>
                  <Input
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="For push notifications"
                    className="mt-1"
                  />
                  <p className="text-caption text-muted-foreground mt-1">Used for Telegram push notifications.</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-3 space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Theme</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
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
              <CardHeader><CardTitle className="text-sm">Accent Colour</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3">
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

          <TabsContent value="integrations" className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect external services to extend NQI Hub's capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {INTEGRATIONS.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id} className="relative overflow-hidden">
                    <CardContent className="pt-5 pb-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${integration.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{integration.name}</p>
                            <Badge variant="outline" className="text-[10px] mt-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400">
                              Not Connected
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-caption text-muted-foreground leading-relaxed">
                        {integration.description}
                      </p>
                      <Button variant="outline" size="sm" className="w-full gap-1.5" disabled>
                        <ExternalLink className="h-3 w-3" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="text-caption text-muted-foreground">
              Integration connections are coming soon. Contact your administrator for early access.
            </p>
          </TabsContent>

          <TabsContent value="notifications" className="mt-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'task_assigned', label: 'Task assigned to me' },
                  { key: 'delivery_reminder', label: 'Workshop delivery reminders' },
                  { key: 'invoice_overdue', label: 'Invoice overdue alerts' },
                  { key: 'form_response', label: 'New feedback form responses' },
                  { key: 'project_status', label: 'Project status changes' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{item.label}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-caption text-muted-foreground">In-app</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-caption text-muted-foreground">Telegram</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-caption text-muted-foreground mt-3">
                  Telegram notifications require a Telegram Chat ID in your profile settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
