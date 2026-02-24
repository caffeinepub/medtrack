import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Activity, Shield, TrendingUp, Clock, Loader2, LogIn } from 'lucide-react';
import { Heart } from 'lucide-react';

export function LoginPage() {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        setTimeout(() => login(), 300);
      }
    }
  };

  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'meditrack-app'
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              MediTrack
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Health Records
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo / branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 shadow-sm overflow-hidden">
              <img
                src="/assets/generated/meditrack-logo.dim_128x128.png"
                alt="MediTrack Logo"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const icon = document.createElement('div');
                    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>`;
                    parent.appendChild(icon.firstChild!);
                  }
                }}
              />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">
              Welcome to MediTrack
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Your personal health records tracker. Log, visualize, and analyze your medical
              history — securely stored on-chain.
            </p>
          </div>

          {/* Login card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-8">
            <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
              Sign In to Continue
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Use your Internet Identity to securely access your personal health console. Each
              identity gets a completely separate, private record space.
            </p>

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="w-full rounded-xl text-base font-semibold"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Login with Internet Identity
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              New users will be prompted to set up their profile after login.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: 'Private & Secure', desc: 'On-chain storage' },
              { icon: TrendingUp, label: 'Trend Analysis', desc: 'AI-powered insights' },
              { icon: Clock, label: 'Full History', desc: 'Timeline view' },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="text-center p-3 rounded-xl bg-card border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-screen-xl mx-auto text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <span>© {new Date().getFullYear()} MediTrack. Built with</span>
          <Heart className="w-3 h-3 text-destructive fill-destructive" />
          <span>using</span>
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
