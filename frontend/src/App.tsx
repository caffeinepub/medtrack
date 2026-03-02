import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AddRecordPage } from './pages/AddRecordPage';
import { TimelinePage } from './pages/TimelinePage';
import { AnalysisPage } from './pages/AnalysisPage';
import { LoginPage } from './pages/LoginPage';
import FamilyMembersPage from './pages/FamilyMembersPage';
import RecordsPage from './pages/RecordsPage';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { redirect } from '@tanstack/react-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

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

const recordsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/records',
  component: RecordsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    homeRoute,
    addRoute,
    timelineRoute,
    analysisRoute,
    familyMembersRoute,
    recordsRoute,
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
