import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Activity, PlusCircle, Clock, BarChart2, Users, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserIdentityIndicator } from './UserIdentityIndicator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const navLinks = [
  { to: '/add', label: 'Add Record', icon: PlusCircle },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/family-members', label: 'Family', icon: Users },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
];

export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:shadow-teal-glow transition-shadow">
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
          </Link>

          {/* Desktop Nav — only when authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side: user indicator + mobile menu toggle */}
          <div className="flex items-center gap-2">
            <UserIdentityIndicator />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && isAuthenticated && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
