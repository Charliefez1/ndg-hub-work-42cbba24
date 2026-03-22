import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { session, roles, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    const dest = roles.includes('client') ? '/portal' : '/';
    return <Navigate to={dest} replace />;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast.error(error.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--purple))] to-[hsl(var(--pink))]">
        {/* Decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[-10%] w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-[20%] right-[-15%] w-96 h-96 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute top-[60%] left-[20%] w-48 h-48 rounded-full bg-white/5 blur-xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="font-satoshi text-lg font-bold">NQI</span>
            </div>
            <span className="font-satoshi text-xl font-bold tracking-tight">NQI Hub</span>
          </div>

          <div className="space-y-6">
            <h1 className="font-satoshi text-4xl font-bold leading-tight">
              Your neurodiversity<br />practice, simplified.
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-sm">
              Projects, workshops, invoices, and insights — all in one place. Designed for the way your brain works best.
            </p>
            <div className="flex gap-3">
              {['Projects', 'Workshops', 'Invoices', 'Insights'].map((label) => (
                <span key={label} className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-white/50 text-sm">Neurodiversity Group &mdash; Learning &amp; Development</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center">
              <span className="font-satoshi text-lg font-bold text-white">N</span>
            </div>
            <span className="font-satoshi text-xl font-bold tracking-tight">NDG Hub</span>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">or</span>
                </div>
              </div>

              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="signup">
                  <SignUpForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email address first');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for a password reset link');
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10" />
      </div>
      <Button type="submit" className="w-full h-10" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Sign In
      </Button>
      <button
        type="button"
        onClick={handleForgotPassword}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled={submitting}
      >
        Forgot password?
      </button>
    </form>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password, displayName);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account.');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Display Name</Label>
        <Input id="signup-name" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10" />
      </div>
      <Button type="submit" className="w-full h-10" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Sign Up
      </Button>
    </form>
  );
}
