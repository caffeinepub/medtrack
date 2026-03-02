import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Activity, Menu, X, Clock, BarChart2, PlusCircle, Users, FolderOpen } from 'lucide-react';
import { UserIdentityIndicator } from './UserIdentityIndicator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const navLinks = [
  { to: '/add', label: 'Add Record', icon: PlusCircle },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/records', label: 'Records', icon: FolderOpen },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/family-members', label: 'Family', icon: Users },
];

export function Navigation() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">MediTrack</span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && <UserIdentityIndicator />}
            {/* Mobile hamburger */}
            {isAuthenticated && (
              <button
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
