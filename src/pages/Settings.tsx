import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStoredTheme, getStoredAccent, setTheme, setAccent, type Theme, type Accent } from '@/lib/theme';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

const ACCENT_OPTIONS: { value: Accent; label: string; color: string }[] = [
  { value: 'steel', label: 'Steel', color: '#4A7CBA' },
  { value: 'sky', label: 'Sky', color: '#0EA5E9' },
  { value: 'mint', label: 'Mint', color: '#10B981' },
  { value: 'amber', label: 'Amber', color: '#F59E0B' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme());
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  // Load telegram_chat_id from profiles
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
      <div className="space-y-lg">
        <h1 className="text-page-title">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-md space-y-md">
            <Card>
              <CardHeader><CardTitle className="text-body">Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-md">
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
                  <p className="text-caption text-text-3 mt-1">Used for Telegram push notifications.</p>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

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

          <TabsContent value="notifications" className="mt-md">
            <Card>
              <CardHeader><CardTitle className="text-body">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-md">
                {[
                  { key: 'task_assigned', label: 'Task assigned to me' },
                  { key: 'delivery_reminder', label: 'Workshop delivery reminders' },
                  { key: 'invoice_overdue', label: 'Invoice overdue alerts' },
                  { key: 'form_response', label: 'New feedback form responses' },
                  { key: 'project_status', label: 'Project status changes' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-body">{item.label}</p>
                    </div>
                    <div className="flex gap-md items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-caption text-text-3">In-app</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-caption text-text-3">Telegram</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-caption text-text-3 mt-md">
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
