import { Outlet } from '@tanstack/react-router';
import { Navigation } from './Navigation';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { Heart } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllRecords } from '../hooks/useQueries';

export function Layout() {
  const year = new Date().getFullYear();
  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'meditrack-app'
  );
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: records } = useGetAllRecords();
  const hasRecords = isAuthenticated && (records?.length ?? 0) > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <AuthGuard>
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          {hasRecords ? (
            <div className="flex gap-6 items-start">
              <DashboardSidebar />
              <div className="flex-1 min-w-0">
                <Outlet />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </AuthGuard>
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {year} MediTrack. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with{' '}
            <Heart className="w-3.5 h-3.5 text-destructive fill-destructive mx-0.5" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
