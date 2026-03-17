import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Theme, Accent, getStoredTheme, getStoredAccent, setTheme, setAccent } from '@/lib/theme';
import { cn } from '@/lib/utils';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const ACCENTS: { value: Accent; label: string; color: string }[] = [
  { value: 'steel', label: 'Steel', color: 'bg-[hsl(213,40%,51%)]' },
  { value: 'sky', label: 'Sky', color: 'bg-[hsl(199,89%,48%)]' },
  { value: 'mint', label: 'Mint', color: 'bg-[hsl(160,84%,39%)]' },
  { value: 'amber', label: 'Amber', color: 'bg-[hsl(38,92%,50%)]' },
  { value: 'purple', label: 'Purple', color: 'bg-[hsl(258,90%,66%)]' },
];

export default function Settings() {
  const { profile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme());
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated');
  };

  const handleTheme = (t: Theme) => {
    setTheme(t);
    setCurrentTheme(t);
  };

  const handleAccent = (a: Accent) => {
    setAccent(a);
    setCurrentAccent(a);
  };

  return (
    <AppShell>
      <div className="space-y-lg max-w-2xl">
        <h1 className="text-page-title">Settings</h1>

        <Card>
          <CardHeader><CardTitle className="text-card-title">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-md">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm">
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-card-title">Appearance</CardTitle></CardHeader>
          <CardContent className="space-y-md">
            <div>
              <Label className="mb-2 block">Theme</Label>
              <div className="flex gap-sm">
                {THEMES.map((t) => (
                  <Button
                    key={t.value}
                    variant={currentTheme === t.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTheme(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Accent Colour</Label>
              <div className="flex gap-sm">
                {ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => handleAccent(a.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      a.color,
                      currentAccent === a.value ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    title={a.label}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
