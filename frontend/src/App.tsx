import React from 'react';
import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AddRecordPage } from './pages/AddRecordPage';
import { TimelinePage } from './pages/TimelinePage';
import { AnalysisPage } from './pages/AnalysisPage';
import FamilyMembersPage from './pages/FamilyMembersPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';

const queryClient = new QueryClient();

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route (standalone)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Protected layout route
function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  if (isInitializing) return null;
  if (!identity) {
    throw redirect({ to: '/login' });
  }
  return <Layout />;
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  component: ProtectedLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: HomePage,
});

const addRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/add',
  component: AddRecordPage,
});

const timelineRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/timeline',
  component: TimelinePage,
});

const analysisRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/analysis',
  component: AnalysisPage,
});

const familyMembersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/family-members',
  component: FamilyMembersPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    homeRoute,
    addRoute,
    timelineRoute,
    analysisRoute,
    familyMembersRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
